import { ParsedUserGroup, UserGroupParser, UserGroupRole } from '../userGroupParser';
import { logger } from 'mol-lib-common';
import { MOLSecurityHeaderKeys } from 'mol-lib-api-contract/auth/common/mol-security-headers';
import { MOLAuthType } from 'mol-lib-api-contract/auth/common/MOLAuthType';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

beforeEach(() => {
	jest.resetAllMocks();
	(logger.warn as jest.Mock).mockImplementation(() => {});
});

jest.mock('mol-lib-common/debugging/logging/LoggerV2', () => {
	const actual = jest.requireActual('mol-lib-common/debugging/logging/LoggerV2');

	const loggerMock = actual.logger;
	loggerMock.warn = jest.fn();

	return {
		...actual,
		logger: loggerMock,
	};
});

describe('user group parser tests', () => {
	it('should not parse null', async () => {
		const parsedNull = UserGroupParser.parseAdminUserGroups(null);
		const parsedUndefined = UserGroupParser.parseAdminUserGroups(undefined);

		expect(parsedNull).toStrictEqual([]);
		expect(parsedUndefined).toStrictEqual([]);
	});

	it('should not parse invalid string', async () => {
		const parsed = UserGroupParser.parseAdminUserGroups('asd');
		expect(parsed).toStrictEqual([]);
	});

	it('should not parse invalid role', async () => {
		const parsed = UserGroupParser.parseAdminUserGroups('bookingsg:custom:localorg');
		expect(parsed).toStrictEqual([]);
	});

	it('should not parse empty role', async () => {
		const parsed = UserGroupParser.parseAdminUserGroups('bookingsg::localorg');
		expect(parsed).toStrictEqual([]);
	});

	it('should not parse empty organisation', async () => {
		const parsed = UserGroupParser.parseAdminUserGroups('bookingsg:org-admin:');
		expect(parsed).toStrictEqual([]);
	});

	it(`should not parse other product's role`, async () => {
		const parsed = UserGroupParser.parseAdminUserGroups('someproduct:org-admin:localorg');
		expect(parsed).toStrictEqual([]);
	});

	it('should parse org admin group', async () => {
		const parsed = UserGroupParser.parseAdminUserGroups('bookingsg:org-admin:localorg');
		expect(parsed).toStrictEqual([
			{
				groupStr: 'bookingsg:org-admin:localorg',
				organisationRef: 'localorg',
				productRef: 'bookingsg',
				serviceRef: undefined,
				userGroupRole: UserGroupRole.OrganisationAdmin,
			} as ParsedUserGroup,
		]);
	});

	it('should parse org admin group', async () => {
		const parsed = UserGroupParser.parseAdminUserGroups('bookingsg:svc-admin-career:localorg');
		expect(parsed).toStrictEqual([
			{
				groupStr: 'bookingsg:svc-admin-career:localorg',
				organisationRef: 'localorg',
				productRef: 'bookingsg',
				serviceRef: 'career',
				userGroupRole: UserGroupRole.ServiceAdmin,
			} as ParsedUserGroup,
		]);
	});

	it('should parse service provider group', async () => {
		const parsed = UserGroupParser.parseAdminUserGroups('bookingsg:service-provider:localorg');
		expect(parsed).toStrictEqual([
			{
				groupStr: 'bookingsg:service-provider:localorg',
				organisationRef: 'localorg',
				productRef: 'bookingsg',
				serviceRef: undefined,
				userGroupRole: UserGroupRole.ServiceProvider,
			} as ParsedUserGroup,
		]);
	});

	it('should parse agency group', async () => {
		const parsed = UserGroupParser.parseAgencyUserGroup('agency1');
		expect(parsed).toStrictEqual({
			groupStr: 'bookingsg:org-admin:agency1',
			organisationRef: 'agency1',
			productRef: 'bookingsg',
			serviceRef: undefined,
			userGroupRole: UserGroupRole.OrganisationAdmin,
		} as ParsedUserGroup);
	});

	it('should parse admin from headers', async () => {
		const headers = {};
		headers[MOLSecurityHeaderKeys.AUTH_TYPE] = MOLAuthType.ADMIN;
		headers[MOLSecurityHeaderKeys.ADMIN_ID] = 'd080f6ed-3b47-478a-a6c6-dfb5608a199d';
		headers[MOLSecurityHeaderKeys.ADMIN_USERNAME] = 'UserName';
		headers[MOLSecurityHeaderKeys.ADMIN_EMAIL] = 'test@email.com';
		headers[MOLSecurityHeaderKeys.ADMIN_NAME] = 'Name';
		headers[MOLSecurityHeaderKeys.ADMIN_GROUPS] = 'bookingsg:org-admin:localorg';

		const parsed = UserGroupParser.parseUserGroupsFromHeaders(headers);
		expect(parsed).toStrictEqual([
			{
				groupStr: 'bookingsg:org-admin:localorg',
				organisationRef: 'localorg',
				productRef: 'bookingsg',
				serviceRef: undefined,
				userGroupRole: UserGroupRole.OrganisationAdmin,
			} as ParsedUserGroup,
		]);
	});

	it('should parse agency from headers', async () => {
		const headers = {};
		headers[MOLSecurityHeaderKeys.AUTH_TYPE] = MOLAuthType.AGENCY;
		headers[MOLSecurityHeaderKeys.AGENCY_APP_ID] = 'agency-first-app';
		headers[MOLSecurityHeaderKeys.AGENCY_NAME] = 'agency1';

		const parsed = UserGroupParser.parseUserGroupsFromHeaders(headers);
		expect(parsed).toStrictEqual([
			{
				groupStr: 'bookingsg:org-admin:agency1',
				organisationRef: 'agency1',
				productRef: 'bookingsg',
				serviceRef: undefined,
				userGroupRole: UserGroupRole.OrganisationAdmin,
			} as ParsedUserGroup,
		]);
	});

	it('should not parse empty agency from headers', async () => {
		const headers = {};
		headers[MOLSecurityHeaderKeys.AUTH_TYPE] = MOLAuthType.AGENCY;
		headers[MOLSecurityHeaderKeys.AGENCY_APP_ID] = '53809107-16ac-4b1b-8434-d05888ae1f6e';
		headers[MOLSecurityHeaderKeys.AGENCY_NAME] = '';

		const parsed = UserGroupParser.parseUserGroupsFromHeaders(headers);
		expect(parsed.length).toBe(0);
	});

	it('should not parse undefined headers', async () => {
		const parsed = UserGroupParser.parseUserGroupsFromHeaders(undefined);
		expect(parsed.length).toBe(0);
	});
});
