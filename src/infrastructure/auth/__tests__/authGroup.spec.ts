import { Organisation, Service, ServiceProvider, User } from '../../../models';
import {
	CitizenAuthGroup,
	IAuthGroupVisitor,
	OrganisationAdminAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../authGroup';

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
		visitCitizen: jest.fn(),
		visitOrganisationAdmin: jest.fn(),
		visitServiceAdmin: jest.fn(),
		visitServiceProvider: jest.fn(),
	} as IAuthGroupVisitor;

	it('should validate user type for user groups', async () => {
		expect(() => new CitizenAuthGroup(adminMock)).toThrowError();
		expect(() => new OrganisationAdminAuthGroup(singpassMock, [organisation])).toThrowError();
		expect(() => new ServiceAdminAuthGroup(singpassMock, [service])).toThrowError();
		expect(() => new ServiceProviderAuthGroup(singpassMock, serviceProvider)).toThrowError();
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
