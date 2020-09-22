import { Inject, InRequestScope } from 'typescript-ioc';
import { UsersRepository } from './users.repository';
import { User } from '../../models';
import { MOLAuthType } from 'mol-lib-api-contract/auth/common/MOLAuthType';
import { MOLSecurityHeaderKeys } from 'mol-lib-api-contract/auth/common/mol-security-headers';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { logger } from 'mol-lib-common/debugging/logging/LoggerV2';
import { AdminUserGroupParser, ParsedUserGroup, UserGroupRole } from '../../infrastructure/auth/adminUserGroupParser';
import {
	AuthGroup,
	OrganisationAdminAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../../infrastructure/auth/authGroup';
import { ServiceRefInfo, ServicesRepository } from '../services/services.repository';
import { ServiceProvidersRepository } from '../serviceProviders/serviceProviders.repository';
import { OrganisationInfo, OrganisationsService } from '../organisations/organisations.service';

export type HeadersType = { [key: string]: string };

@InRequestScope
export class UsersService {
	@Inject
	private organisationsService: OrganisationsService;
	@Inject
	private servicesRepository: ServicesRepository;
	@Inject
	private serviceProvidersRepository: ServiceProvidersRepository;
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

		let user: User;
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
				});
				break;
		}

		if (!user) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_AUTHENTICATION).setMessage(
				'BookingSG User could not be created. authType: ' + authType,
			);
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
	}): Promise<User> {
		if (!data.molAdminId || !data.email) {
			return null;
		}

		const adminUser = User.createAdminUser(data);
		return await this.getOrSaveInternal(adminUser, () => this.usersRepository.getUserByMolAdminId(data.molAdminId));
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
			const services = await this.servicesRepository.getServicesForUserGroups(serviceGroupRefs);

			const notFoundGroupRefs = parsedGroups.filter(
				(g) =>
					!services.find(
						(s) =>
							s._serviceAdminGroupMap.serviceOrganisationRef === `${g.serviceRef}:${g.organisationRef}`,
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
			const serviceProvider = await this.serviceProvidersRepository.getServiceProviderByMolAdminId({
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

	public async getAdminUserGroupsFromHeaders(user: User, headers: HeadersType): Promise<AuthGroup[]> {
		const molAdminId = headers[MOLSecurityHeaderKeys.ADMIN_ID];
		const groupListStr = headers[MOLSecurityHeaderKeys.ADMIN_GROUPS];
		const parsedGroups = AdminUserGroupParser.parseUserGroups(groupListStr);
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
}
