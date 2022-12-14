import { Organisation, Service, ServiceProvider, User } from '../../../models';
import {
	AnonymousAuthGroup,
	CitizenAuthGroup,
	IAuthGroupVisitor,
	OrganisationAdminAuthGroup,
	OtpAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../authGroup';
import * as uuid from 'uuid';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

beforeEach(() => {
	jest.resetAllMocks();
});

describe('auth group tests', () => {
	const organisation = new Organisation();
	organisation.id = 1;
	const service = new Service();
	service.id = 1;
	const serviceProvider = ServiceProvider.create('Peter', service.id, 'test@email.com', '0000');

	const singpassMock = User.createSingPassUser('d080f6ed-3b47-478a-a6c6-dfb5608a199d', 'ABC1234');
	const adminMock = User.createAdminUser({
		molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
		userName: 'UserName',
		email: 'test@email.com',
		name: 'Name',
	});

	const visitorMock = {
		visitAnonymous: jest.fn(),
		visitOtp: jest.fn(),
		visitCitizen: jest.fn(),
		visitOrganisationAdmin: jest.fn(),
		visitServiceAdmin: jest.fn(),
		visitServiceProvider: jest.fn(),
	} as IAuthGroupVisitor;

	it('should validate user type for user groups', async () => {
		expect(() => new AnonymousAuthGroup(adminMock)).toThrowError();
		expect(() => new CitizenAuthGroup(adminMock)).toThrowError();
		expect(() => new OrganisationAdminAuthGroup(singpassMock, [organisation])).toThrowError();
		expect(() => new ServiceAdminAuthGroup(singpassMock, [service])).toThrowError();
		expect(() => new ServiceProviderAuthGroup(singpassMock, serviceProvider)).toThrowError();
	});

	it('should create otp group', async () => {
		const otp = User.createOtpUser('+6584000000');
		const authGroup = new OtpAuthGroup(otp);
		expect(authGroup).toBeDefined();
	});

	it('should create anonymous group', async () => {
		const anonymous = User.createAnonymousUser({ createdAt: new Date(), trackingId: uuid.v4() });
		const authGroup = new AnonymousAuthGroup(anonymous);
		expect(authGroup).toBeDefined();
	});

	it('should create anonymous group (with booking info)', async () => {
		const anonymous = User.createAnonymousUser({ createdAt: new Date(), trackingId: uuid.v4() });
		const authGroup = new AnonymousAuthGroup(anonymous, {
			bookingUUID: '81baeb3f-d930-4f48-9808-3ee4debc3d8a',
			bookingId: 1,
			serviceId: 2,
			organisationId: 3,
			serviceProviderId: 4,
		});

		expect(authGroup).toBeDefined();

		expect(authGroup.bookingInfo).toEqual({
			bookingUUID: '81baeb3f-d930-4f48-9808-3ee4debc3d8a',
			bookingId: 1,
			serviceId: 2,
			organisationId: 3,
			serviceProviderId: 4,
		});
	});

	it('should create citizen group', async () => {
		const authGroup = new CitizenAuthGroup(singpassMock);
		expect(authGroup).toBeDefined();
	});

	it('should create organisation admin group', async () => {
		const authGroup = new OrganisationAdminAuthGroup(adminMock, [organisation]);
		expect(authGroup).toBeDefined();
	});

	it('should validate organisation admin group', async () => {
		expect(() => new OrganisationAdminAuthGroup(adminMock, [])).toThrowError();
	});

	it('should create service admin group', async () => {
		const authGroup = new ServiceAdminAuthGroup(adminMock, [service]);
		expect(authGroup).toBeDefined();
	});

	it('should validate service admin group', async () => {
		expect(() => new ServiceAdminAuthGroup(adminMock, [])).toThrowError();
	});

	it('should create service provider group', async () => {
		const authGroup = new ServiceProviderAuthGroup(adminMock, serviceProvider);
		expect(authGroup).toBeDefined();
	});

	it('should validate service provider group', async () => {
		expect(() => new ServiceProviderAuthGroup(adminMock, null)).toThrowError();
	});

	it('should visit anonymous group', async () => {
		const anonymous = User.createAnonymousUser({ createdAt: new Date(), trackingId: uuid.v4() });
		const authGroup = new AnonymousAuthGroup(anonymous);

		authGroup.acceptVisitor(visitorMock);
		expect(visitorMock.visitAnonymous).toBeCalledTimes(1);
	});

	it('should visit citizen group', async () => {
		const authGroup = new CitizenAuthGroup(singpassMock);

		authGroup.acceptVisitor(visitorMock);
		expect(visitorMock.visitCitizen).toBeCalledTimes(1);
	});

	it('should visit organisation admin group', async () => {
		const authGroup = new OrganisationAdminAuthGroup(adminMock, [organisation]);

		authGroup.acceptVisitor(visitorMock);
		expect(visitorMock.visitOrganisationAdmin).toBeCalledTimes(1);
	});

	it('should visit service admin group', async () => {
		const authGroup = new ServiceAdminAuthGroup(adminMock, [service]);

		authGroup.acceptVisitor(visitorMock);
		expect(visitorMock.visitServiceAdmin).toBeCalledTimes(1);
	});

	it('should visit service provider group', async () => {
		const authGroup = new ServiceProviderAuthGroup(adminMock, serviceProvider);

		authGroup.acceptVisitor(visitorMock);
		expect(visitorMock.visitServiceProvider).toBeCalledTimes(1);
	});
});
