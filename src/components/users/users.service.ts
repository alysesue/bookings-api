import { Inject, InRequestScope } from 'typescript-ioc';
import { MOLAuthType } from 'mol-lib-api-contract/auth/common/MOLAuthType';
import { MOLSecurityHeaderKeys } from 'mol-lib-api-contract/auth/common/mol-security-headers';
import { logger } from 'mol-lib-common';
import { User } from '../../models';
import { ParsedUserGroup, UserGroupParser, UserGroupRole } from '../../infrastructure/auth/userGroupParser';
import {
	AnonymousAuthGroup,
	AuthGroup,
	OrganisationAdminAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../../infrastructure/auth/authGroup';
import { OrganisationInfo, OrganisationsService } from '../organisations/organisations.service';
import { ServiceRefInfo, ServicesRepositoryNoAuth } from '../services/services.noauth.repository';
import { ServiceProvidersRepositoryNoAuth } from '../serviceProviders/serviceProviders.noauth.repository';
import { AnonymousCookieData } from '../../infrastructure/bookingSGCookieHelper';
import { UsersRepository } from './users.repository';
import { BookingsNoAuthRepository } from '../bookings/bookings.noauth.repository';
import { OrganisationsNoauthRepository } from '../organisations/organisations.noauth.repository';

export type HeadersType = { [key: string]: string };

@InRequestScope
export class UsersService {
	@Inject
	private organisationsService: OrganisationsService;
	@Inject
	private servicesRepositoryNoAuth: ServicesRepositoryNoAuth;
	@Inject
	private organisationRepositoryNoAuth: OrganisationsNoauthRepository;
	@Inject
	private serviceProvidersRepositoryNoAuth: ServiceProvidersRepositoryNoAuth;
	@Inject
	private usersRepository: UsersRepository;
	@Inject
	private bookingNoAuthRepository: BookingsNoAuthRepository;

	private async getOrSaveInternal(user: User, getter: () => Promise<User>, adminGroups?: string): Promise<User> {
		const existingUser = await getter();
		let userToSave = existingUser ? null : user;

		if (adminGroups) {
			userToSave = existingUser || user;

			const parsedUserGroups = UserGroupParser.parseAdminUserGroups(adminGroups);

			const servicesToMapRefs = parsedUserGroups.filter(
				(group) => group.userGroupRole === UserGroupRole.ServiceAdmin,
			);
			const servicesToMap = await this.servicesRepositoryNoAuth.getServicesForUserGroups(
				servicesToMapRefs as ServiceRefInfo[],
			);

			const orgsToMapRefs = parsedUserGroups
				.filter((group) => group.userGroupRole === UserGroupRole.OrganisationAdmin)
				.map((group) => group.organisationRef);
			const orgsToMap = await this.organisationRepositoryNoAuth.getOrganisationsForUserGroups(orgsToMapRefs);

			userToSave.adminUser.services = servicesToMap;
			userToSave.adminUser.organisations = orgsToMap;
		}

		if (userToSave) {
			try {
				await this.usersRepository.save(userToSave);
			} catch (e) {
				// concurrent insert fail case
				logger.warn('Exception when creating BookingSG User', e);
			}
		}

		const savedUser = await getter();
		return savedUser;
	}

	private async saveUserInternal(user: User): Promise<User> {
		if (!user) return;
		try {
			return await this.usersRepository.save(user);
		} catch (e) {
			// concurrent insert fail case
			logger.warn('Exception when creating BookingSG User', e);
		}
	}

	public async getOrSaveUserFromHeaders(headers: HeadersType): Promise<User> {
		const authType = headers[MOLSecurityHeaderKeys.AUTH_TYPE];
		if (!authType) {
			return null;
		}

		let user: User = null;
		switch (authType) {
			case MOLAuthType.USER:
				user = await this.getOrSaveSingpassUser({
					molUserId: headers[MOLSecurityHeaderKeys.USER_ID],
					molUserUinFin: headers[MOLSecurityHeaderKeys.USER_UINFIN],
				});
				break;
			case MOLAuthType.ADMIN:
				user = await this.getOrSaveAdminUser({
					molAdminId: headers[MOLSecurityHeaderKeys.ADMIN_ID],
					userName: headers[MOLSecurityHeaderKeys.ADMIN_USERNAME],
					email: headers[MOLSecurityHeaderKeys.ADMIN_EMAIL],
					name: headers[MOLSecurityHeaderKeys.ADMIN_NAME],
					agencyUserId: headers[MOLSecurityHeaderKeys.ADMIN_AGENCY_USER_ID],
					adminGroups: headers[MOLSecurityHeaderKeys.ADMIN_GROUPS],
				});
				break;
			case MOLAuthType.AGENCY:
				user = await this.getOrSaveAgencyUser({
					agencyAppId: headers[MOLSecurityHeaderKeys.AGENCY_APP_ID],
					agencyName: headers[MOLSecurityHeaderKeys.AGENCY_NAME],
				});
				break;
		}

		return user;
	}

	/**
	 * This function is intended for use in two places
	 * 1. When admin makes a booking on behalf of a singpass user
	 * 2. When citizen logs in using singpass
	 *
	 * For scenario 1, admin only has the NRIC of the user, and not the molUserId, hence molUserId is made optional
	 *
	 * For scenarios 2, when citizen logs in and the database does not have molUserUinFin, it means the singpass user in database is created
	 * when admin made a booking, hence we will save the logged in user's molUserId along
	 */

	public async getOrSaveSingpassUser({
		molUserId,
		molUserUinFin,
	}: {
		molUserId: string;
		molUserUinFin: string;
	}): Promise<User> {
		// Creating of singpass user will at least require one of the following fields (to cater for admin creation)
		if (!molUserId && !molUserUinFin) return null;

		let singPassUser = await this.usersRepository.getUserByMolUserId(molUserId);
		if (!singPassUser) singPassUser = await this.usersRepository.getUserByUinFin(molUserUinFin);
		if (!singPassUser) {
			const user = User.createSingPassUser(molUserId, molUserUinFin);
			return this.saveUserInternal(user);
		}

		if (!singPassUser._singPassUser.molUserId) {
			singPassUser._singPassUser.molUserId = molUserId;
			return await this.saveUserInternal(singPassUser);
		}

		return singPassUser;
	}

	public async getOrSaveAdminUser(data: {
		molAdminId: string;
		userName: string;
		email: string;
		name: string;
		agencyUserId?: string;
		adminGroups?: string;
	}): Promise<User> {
		if (!data.molAdminId || !data.email) {
			return null;
		}

		const adminUser = User.createAdminUser(data);
		return await this.getOrSaveInternal(
			adminUser,
			() => this.usersRepository.getUserByMolAdminId(data.molAdminId),
			data.adminGroups,
		);
	}

	public async getOrSaveAgencyUser(data: { agencyAppId: string; agencyName: string }): Promise<User> {
		if (!data.agencyAppId || !data.agencyName) {
			return null;
		}

		const agencyUser = User.createAgencyUser(data);
		return await this.getOrSaveInternal(agencyUser, () =>
			this.usersRepository.getUserByAgencyAppId(data.agencyAppId),
		);
	}

	private async getOrganisationAdminUserGroup({
		user,
		parsedGroups,
	}: {
		user: User;
		parsedGroups: ParsedUserGroup[];
	}): Promise<AuthGroup> {
		let organisationAdminUserGroup: OrganisationAdminAuthGroup = null;

		const orgAdminRoles = parsedGroups
			.filter((g) => g.userGroupRole === UserGroupRole.OrganisationAdmin)
			.map<OrganisationInfo>((g) => ({
				organisationRef: g.organisationRef,
			}));

		if (orgAdminRoles.length === 0) {
			return organisationAdminUserGroup;
		}

		const organisations = await this.organisationsService.getOrganisationsForGroups(orgAdminRoles);
		if (organisations.length > 0) {
			organisationAdminUserGroup = new OrganisationAdminAuthGroup(user, organisations);
		}

		return organisationAdminUserGroup;
	}

	private async getServiceAdminUserGroup({
		user,
		parsedGroups,
	}: {
		user: User;
		parsedGroups: ParsedUserGroup[];
	}): Promise<AuthGroup> {
		let serviceAdminUserGroup: ServiceAdminAuthGroup = null;

		const svcAdminRoles = parsedGroups.filter((g) => g.userGroupRole === UserGroupRole.ServiceAdmin);
		if (svcAdminRoles.length > 0) {
			const serviceGroupRefs = svcAdminRoles.map<ServiceRefInfo>((g) => ({
				serviceRef: g.serviceRef,
				organisationRef: g.organisationRef,
			}));
			const services = await this.servicesRepositoryNoAuth.getServicesForUserGroups(serviceGroupRefs);

			const notFoundGroupRefs = parsedGroups.filter(
				(g) =>
					!services.find(
						(s) => s.serviceAdminGroupMap.serviceOrganisationRef === `${g.serviceRef}:${g.organisationRef}`,
					),
			);
			if (notFoundGroupRefs.length > 0) {
				const notFoundStr = notFoundGroupRefs.map((g) => g.groupStr).join(', ');
				logger.warn(`Service(s) not found in BookingSG for user group(s): ${notFoundStr}`);
			}

			if (services.length > 0) {
				serviceAdminUserGroup = new ServiceAdminAuthGroup(user, services);
			}
		}

		return serviceAdminUserGroup;
	}

	private async getServiceProviderUserGroup({
		user,
		parsedGroups,
		molAdminId,
	}: {
		user: User;
		parsedGroups: ParsedUserGroup[];
		molAdminId: string;
	}): Promise<AuthGroup> {
		let serviceProviderUserGroup: ServiceProviderAuthGroup = null;

		const serviceProviderRole = parsedGroups.find((g) => g.userGroupRole === UserGroupRole.ServiceProvider);
		if (serviceProviderRole) {
			const serviceProvider = await this.serviceProvidersRepositoryNoAuth.getServiceProviderByMolAdminId({
				molAdminId,
			});
			if (serviceProvider) {
				serviceProviderUserGroup = new ServiceProviderAuthGroup(user, serviceProvider);
			} else {
				logger.warn(`Service provider not found in BookingSG for mol-admin-id: ${molAdminId}`);
			}
		}

		return serviceProviderUserGroup;
	}

	public async getUserGroupsFromHeaders(user: User, headers: HeadersType): Promise<AuthGroup[]> {
		const molAdminId = headers[MOLSecurityHeaderKeys.ADMIN_ID];
		const parsedGroups = UserGroupParser.parseUserGroupsFromHeaders(headers);
		const groups: AuthGroup[] = [];

		const orgAdmin = await this.getOrganisationAdminUserGroup({ user, parsedGroups });
		if (orgAdmin) {
			groups.push(orgAdmin);
		}

		const svcAdmin = await this.getServiceAdminUserGroup({ user, parsedGroups });
		if (svcAdmin) {
			groups.push(svcAdmin);
		}

		const svcProviderAdmin = await this.getServiceProviderUserGroup({ user, parsedGroups, molAdminId });
		if (svcProviderAdmin) {
			groups.push(svcProviderAdmin);
		}

		return groups;
	}

	public async createAnonymousUserFromCookie(data: AnonymousCookieData): Promise<User> {
		const user = await this.usersRepository.getUserByTrackingId(data.trackingId);
		if (user) {
			return user;
		}

		// Creates user only in memory till a booking is made to avoid populating the database.
		return User.createAnonymousUser(data);
	}

	public async getAnonymousUserRoles(user: User, otp?: { mobileNo: string }): Promise<AuthGroup[]> {
		if (!user.isAnonymous()) return [];

		if (user.anonymousUser.bookingUUID) {
			const bookingInfo = await this.bookingNoAuthRepository.getBookingInfoByUUID(user.anonymousUser.bookingUUID);
			if (!bookingInfo) {
				return [];
			} else {
				return [new AnonymousAuthGroup(user, bookingInfo, otp)];
			}
		}

		return [new AnonymousAuthGroup(user, undefined, otp)];
	}

	public async persistUserIfRequired(user: User): Promise<User> {
		if (user.isPersisted()) return user;

		if (user.isAnonymous()) {
			const usersRepo = this.usersRepository;
			return await this.getOrSaveInternal(user, () =>
				usersRepo.getUserByTrackingId(user.anonymousUser.trackingId),
			);
		}

		return user;
	}

	public async getOtpUser(mobileNo: string): Promise<User> {
		return await this.usersRepository.getUserByMobileNo(mobileNo);
	}

	public async createOtpUser(mobileNo: string): Promise<User> {
		const otpUser = User.createOtpUser(mobileNo);
		return await this.usersRepository.save(otpUser);
	}
}
