import { Service, User } from '../../../models';
import { UserProfileMapper } from '../users.mapper';
import * as uuid from 'uuid';
import { AnonymousAuthGroup, ServiceAdminAuthGroup } from '../../../infrastructure/auth/authGroup';
import { Container } from 'typescript-ioc';
import { IdHasher } from '../../../infrastructure/idHasher';
import { IdHasherMock } from '../../../infrastructure/__mocks__/idHasher.mock';
import {
	AdminUserContract,
	AgencyUserContract,
	OtpUserContract,
	SingPassUserContract,
	UserTypeContract,
} from '../users.apicontract';

describe('Users mapper', () => {
	beforeAll(() => {
		Container.bind(IdHasher).to(IdHasherMock);
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should map anonymous user', async () => {
		const anonymous = User.createAnonymousUser({ createdAt: new Date(), trackingId: uuid.v4() });

		const response = UserProfileMapper.mapUserToResponse(anonymous);
		expect(response).toEqual({ userType: UserTypeContract.anonymous });
	});

	it('should map singpass user', async () => {
		const singpass = User.createSingPassUser('d080f6ed-3b47-478a-a6c6-dfb5608a199d', 'S1234567D');
		const singpassUserContract = new SingPassUserContract();
		singpassUserContract.uinfin = 'S1234567D';

		const response = UserProfileMapper.mapUserToResponse(singpass);
		expect(response).toEqual({ singpass: singpassUserContract, userType: UserTypeContract.singpass });
	});

	it('should map admin user', async () => {
		const admin = User.createAdminUser({
			molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
			userName: 'UserName',
			email: 'test@email.com',
			name: 'Name',
			agencyUserId: 'agencyId',
		});

		const adminUserContract = new AdminUserContract();
		adminUserContract.email = 'test@email.com';
		adminUserContract.agencyUserId = 'agencyId';
		adminUserContract.name = 'Name';

		const response = UserProfileMapper.mapUserToResponse(admin);
		expect(response).toEqual({ admin: adminUserContract, userType: UserTypeContract.admin });
	});

	it('should map agency user', async () => {
		const admin = User.createAgencyUser({
			agencyAppId: 'demo',
			agencyName: 'demo',
		});

		const agencyUserContract = new AgencyUserContract();
		agencyUserContract.appId = 'demo';
		agencyUserContract.name = 'demo';

		const response = UserProfileMapper.mapUserToResponse(admin);
		expect(response).toEqual({ agency: agencyUserContract, userType: UserTypeContract.agency });
	});

	it('should map otp user', async () => {
		const admin = User.createOtpUser('+6584000000');

		const otpUserContract = new OtpUserContract();
		otpUserContract.mobileNo = '+6584000000';

		const response = UserProfileMapper.mapUserToResponse(admin);
		expect(response).toEqual({ otp: otpUserContract, userType: UserTypeContract.otp });
	});

	it('should map to response V1', async () => {
		const adminMock = User.createAdminUser({
			molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
			userName: 'UserName',
			email: 'test@email.com',
			name: 'Name',
		});
		const service = new Service();
		service.id = 1;
		service.name = 'Service 1';
		const group = new ServiceAdminAuthGroup(adminMock, [service]);

		const response = UserProfileMapper.mapToResponseV1({
			user: adminMock,
			groups: [group],
			otpAddOnMobileNo: 'otpAddOn',
		});
		expect(response).toEqual({
			groups: [{ authGroupType: 'service-admin', services: [{ id: 1, name: 'Service 1' }] }],
			user: { admin: { email: 'test@email.com', name: 'Name' }, userType: 'admin' },
			otpAddon: {
				mobileNo: 'otpAddOn',
			},
		});
	});

	it('should map to response V2', async () => {
		const adminMock = User.createAdminUser({
			molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
			userName: 'UserName',
			email: 'test@email.com',
			name: 'Name',
		});
		const service = new Service();
		service.id = 1;
		service.name = 'Service 1';
		const group = new ServiceAdminAuthGroup(adminMock, [service]);

		IdHasherMock.encode.mockImplementation((id: number) => String(id));

		const response = UserProfileMapper.mapToResponseV2({
			user: adminMock,
			groups: [group],
			otpAddOnMobileNo: 'otpAddOn',
		});
		expect(response).toEqual({
			groups: [{ authGroupType: 'service-admin', services: [{ id: '1', name: 'Service 1' }] }],
			user: { admin: { email: 'test@email.com', name: 'Name' }, userType: 'admin' },
			otpAddon: {
				mobileNo: 'otpAddOn',
			},
		});
	});

	it('should map groups to response V1', async () => {
		const adminMock = User.createAdminUser({
			molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
			userName: 'UserName',
			email: 'test@email.com',
			name: 'Name',
		});
		const service = new Service();
		service.id = 1;
		service.name = 'Service 1';
		const group = new ServiceAdminAuthGroup(adminMock, [service]);

		const response = UserProfileMapper.mapGroupsToResponseV1([group]);
		expect(response).toEqual([{ authGroupType: 'service-admin', services: [{ id: 1, name: 'Service 1' }] }]);
	});

	it('should map groups to response V2', async () => {
		const adminMock = User.createAdminUser({
			molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
			userName: 'UserName',
			email: 'test@email.com',
			name: 'Name',
		});
		const service = new Service();
		service.id = 1;
		service.name = 'Service 1';
		const group = new ServiceAdminAuthGroup(adminMock, [service]);

		IdHasherMock.encode.mockImplementation((id: number) => String(id));

		const response = UserProfileMapper.mapGroupsToResponseV2([group]);
		expect(response).toEqual([{ authGroupType: 'service-admin', services: [{ id: '1', name: 'Service 1' }] }]);
	});

	it('should map anonymous group', async () => {
		const anonymous = User.createAnonymousUser({ createdAt: new Date(), trackingId: uuid.v4() });
		const group = new AnonymousAuthGroup(anonymous);

		const response = UserProfileMapper.mapGroupsToResponseV1([group]);
		expect(response).toEqual([
			{
				authGroupType: 'anonymous',
				anonymous: {
					bookingUUID: undefined,
				},
			},
		]);
	});
});
