import { Inject, InRequestScope } from 'typescript-ioc';
import { UsersRepository } from './users.repository';
import { User } from '../../models';
import { MOLAuthType } from 'mol-lib-api-contract/auth/common/MOLAuthType';
import { MOLSecurityHeaderKeys } from 'mol-lib-api-contract/auth/common/mol-security-headers';
import { logger } from 'mol-lib-common/debugging/logging/LoggerV2';
import { ParsedUserGroup, UserGroupParser, UserGroupRole } from '../../infrastructure/auth/userGroupParser';
import {
	AuthGroup,
	OrganisationAdminAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../../infrastructure/auth/authGroup';
import { OrganisationInfo, OrganisationsService } from '../organisations/organisations.service';
import { ServiceRefInfo, ServicesRepositoryNoAuth } from '../services/services.noauth.repository';
import { ServiceProvidersRepositoryNoAuth } from '../serviceProviders/serviceProviders.noauth.repository';
import { AnonymousCookieData } from '../../infrastructure/bookingSGCookieHelper';

export type HeadersType = { [key: string]: string };

@InRequestScope
export class UsersService {
	@Inject
	private organisationsService: OrganisationsService;
	@Inject
	private servicesRepositoryNoAuth: ServicesRepositoryNoAuth;
	@Inject
	private serviceProvidersRepositoryNoAuth: ServiceProvidersRepositoryNoAuth;
	@Inject
	private usersRepository: UsersRepository;

	private async getOrSaveInternal(user: User, getter: () => Promise<User>): Promise<User> {
		let userRepo = await getter();
		if (!userRepo) {
			try {
				await this.usersRepository.save(user);
			} catch (e) {
				// concurrent insert fail case
				logger.warn('Exception when creating BookingSG User', e);
			}
			userRepo = await getter();
		}
		return userRepo;
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

	public async getOrSaveSingpassUser({
		molUserId,
		molUserUinFin,
	}: {
		molUserId: string;
		molUserUinFin: string;
	}): Promise<User> {
		if (!molUserId || !molUserUinFin) return null;
		const user = User.createSingPassUser(molUserId, molUserUinFin);
		return await this.getOrSaveInternal(user, () => this.usersRepository.getUserByMolUserId(molUserId));
	}

	public async getOrSaveAdminUser(data: {
		molAdminId: string;
		userName: string;
		email: string;
		name: string;
		agencyUserId?: string;
	}): Promise<User> {
		if (!data.molAdminId || !data.email) {
			return null;
		}

		const adminUser = User.createAdminUser(data);
		return await this.getOrSaveInternal(adminUser, () => this.usersRepository.getUserByMolAdminId(data.molAdminId));
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
}
