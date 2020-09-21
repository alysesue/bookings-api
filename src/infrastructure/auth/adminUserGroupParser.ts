// tslint:disable: tsr-detect-possible-timing-attacks
import { logger } from 'mol-lib-common/debugging/logging/LoggerV2';

const BookingSGToken = 'bookingsg';
const OrgAdminToken = 'org-admin';
const ServiceAdminToken = 'svc-admin-';
const ServiceProviderToken = 'service-provider';

export class AdminUserGroupParser {
	public static parseUserGroups(groupListStr: string): ParsedUserGroup[] {
		if (!groupListStr) {
			return [];
		}

		return groupListStr
			.split(',')
			.map((g) => AdminUserGroupParser.parseUserGroup(g))
			.filter((g) => g);
	}

	private static parseUserGroup(groupStr: string): ParsedUserGroup {
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

		const parsedRole = AdminUserGroupParser.parseGroupRole(roleStr);
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
