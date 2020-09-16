import { logger, LoggerV2 } from 'mol-lib-common/debugging/logging/LoggerV2';

export class AdminUserGroupParser {
	private static readonly BookingSGReference = 'bookingsg';

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
		if (!chunks || chunks.length !== 3 || chunks[0] !== AdminUserGroupParser.BookingSGReference) {
			return null;
		}
		const product = chunks[0];
		const roleStr = chunks[1];
		const organisation = chunks[2];

		if (!roleStr) {
			logger.log(LoggerV2.LogLevel.WARN, 'Invalid group role - missing role: ' + groupStr);
			return null;
		}

		if (!organisation) {
			logger.log(LoggerV2.LogLevel.WARN, 'Invalid group role - missing organisation: ' + groupStr);
			return null;
		}

		const userGroupRole = AdminUserGroupParser.parseGroupRole(roleStr);
		if (!userGroupRole) {
			return null;
		}

		return { groupStr, product, userGroupRole, organisation };
	}

	private static parseGroupRole(roleStr: string): UserGroupRole {
		if (roleStr.startsWith('org-admin')) {
			return UserGroupRole.OrganisationAdmin;
		} else if (roleStr.startsWith('svc-admin')) {
			return UserGroupRole.ServiceAdmin;
		} else if (roleStr.startsWith('service-provider')) {
			return UserGroupRole.ServiceProvider;
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
	product: string;
	userGroupRole: UserGroupRole;
	organisation: string;
};
