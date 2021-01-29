import { MOLSecurityHeaderKeys } from 'mol-lib-api-contract/auth/common/mol-security-headers';
import { MOLAuthType } from 'mol-lib-api-contract/auth/common/MOLAuthType';
// tslint:disable: tsr-detect-possible-timing-attacks
import { logger } from 'mol-lib-common';

const BookingSGToken = 'bookingsg';
const OrgAdminToken = 'org-admin';
const ServiceAdminToken = 'svc-admin-';
const ServiceProviderToken = 'service-provider';

export class UserGroupParser {
	public static parseUserGroupsFromHeaders(headers: { [key: string]: string }): ParsedUserGroup[] {
		if (!headers) {
			return [];
		}

		const parsedUserGroups = [];
		const authType = headers[MOLSecurityHeaderKeys.AUTH_TYPE];
		if (authType === MOLAuthType.ADMIN) {
			const groupListStr = headers[MOLSecurityHeaderKeys.ADMIN_GROUPS];
			const parsedAdminUserGroups = UserGroupParser.parseAdminUserGroups(groupListStr);
			parsedUserGroups.push(...parsedAdminUserGroups);
		} else if (authType === MOLAuthType.AGENCY) {
			const agencyName = headers[MOLSecurityHeaderKeys.AGENCY_NAME];
			const agencyGroup = UserGroupParser.parseAgencyUserGroup(agencyName);
			if (agencyGroup) {
				parsedUserGroups.push(agencyGroup);
			}
		}

		return parsedUserGroups;
	}

	public static parseAgencyUserGroup(agencyName: string): ParsedUserGroup {
		const trimAgencyName = agencyName?.trim().toLowerCase();
		if (trimAgencyName) {
			return {
				groupStr: `${BookingSGToken}:${OrgAdminToken}:${trimAgencyName}`,
				productRef: BookingSGToken,
				userGroupRole: UserGroupRole.OrganisationAdmin,
				serviceRef: undefined,
				organisationRef: trimAgencyName,
			};
		}
		return null;
	}

	public static parseAdminUserGroups(groupListStr: string): ParsedUserGroup[] {
		if (!groupListStr) {
			return [];
		}

		return groupListStr
			.split(',')
			.map((g) => UserGroupParser.parseAdminUserGroup(g))
			.filter((g) => g);
	}

	private static parseAdminUserGroup(groupStr: string): ParsedUserGroup {
		const chunks = groupStr
			.toLowerCase()
			.split(':')
			.map((c) => c.trim());
		if (!chunks || chunks.length !== 3) {
			return null;
		}

		const productRef = chunks[0];
		const roleStr = chunks[1];
		const organisationRef = chunks[2];
		if (productRef !== BookingSGToken) {
			return null;
		}

		if (!roleStr) {
			logger.warn('Invalid group role - missing role: ' + groupStr);
			return null;
		}

		if (!organisationRef) {
			logger.warn('Invalid group role - missing organisation: ' + groupStr);
			return null;
		}

		const parsedRole = UserGroupParser.parseGroupRole(roleStr);
		if (!parsedRole) {
			return null;
		}

		return {
			groupStr,
			productRef,
			userGroupRole: parsedRole.userGroupRole,
			serviceRef: parsedRole.serviceRef,
			organisationRef,
		};
	}

	private static parseGroupRole(roleStr: string): { userGroupRole: UserGroupRole; serviceRef?: string } {
		if (roleStr === OrgAdminToken) {
			return { userGroupRole: UserGroupRole.OrganisationAdmin };
		} else if (roleStr.startsWith(ServiceAdminToken)) {
			const serviceRef = roleStr.substr(ServiceAdminToken.length);
			return { userGroupRole: UserGroupRole.ServiceAdmin, serviceRef };
		} else if (roleStr === ServiceProviderToken) {
			return { userGroupRole: UserGroupRole.ServiceProvider };
		}

		return null;
	}

	public static generateServiceAdminUserGroup(serviceOrganisationRef: string): string {
		return `${BookingSGToken}:${ServiceAdminToken}${serviceOrganisationRef}`;
	}

	public static generateServiceProviderUserGroup(organisationRef: string): string {
		return `${BookingSGToken}:${ServiceProviderToken}:${organisationRef}`;
	}
}

export enum UserGroupRole {
	OrganisationAdmin = 1,
	ServiceAdmin,
	ServiceProvider,
}

export type ParsedUserGroup = {
	groupStr: string;
	productRef: string;
	userGroupRole: UserGroupRole;
	serviceRef?: string;
	organisationRef: string;
};
