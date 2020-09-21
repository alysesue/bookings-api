import { AdminUserGroupParser, ParsedUserGroup, UserGroupRole } from '../adminUserGroupParser';
import { logger } from 'mol-lib-common/debugging/logging/LoggerV2';

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
		const parsedNull = AdminUserGroupParser.parseUserGroups(null);
		const parsedUndefined = AdminUserGroupParser.parseUserGroups(undefined);

		expect(parsedNull).toStrictEqual([]);
		expect(parsedUndefined).toStrictEqual([]);
	});

	it('should not parse invalid string', async () => {
		const parsed = AdminUserGroupParser.parseUserGroups('asd');
		expect(parsed).toStrictEqual([]);
	});

	it('should not parse invalid role', async () => {
		const parsed = AdminUserGroupParser.parseUserGroups('bookingsg:custom:localorg');
		expect(parsed).toStrictEqual([]);
	});

	it('should not parse empty role', async () => {
		const parsed = AdminUserGroupParser.parseUserGroups('bookingsg::localorg');
		expect(parsed).toStrictEqual([]);
	});

	it('should not parse empty organisation', async () => {
		const parsed = AdminUserGroupParser.parseUserGroups('bookingsg:org-admin:');
		expect(parsed).toStrictEqual([]);
	});

	it(`should not parse other product's role`, async () => {
		const parsed = AdminUserGroupParser.parseUserGroups('someproduct:org-admin:localorg');
		expect(parsed).toStrictEqual([]);
	});

	it('should parse org admin group', async () => {
		const parsed = AdminUserGroupParser.parseUserGroups('bookingsg:org-admin:localorg');
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
		const parsed = AdminUserGroupParser.parseUserGroups('bookingsg:svc-admin-career:localorg');
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
		const parsed = AdminUserGroupParser.parseUserGroups('bookingsg:service-provider:localorg');
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
});
