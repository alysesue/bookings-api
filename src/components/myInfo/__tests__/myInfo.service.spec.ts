import { get } from '../../../tools/fetch';
import { Container } from 'typescript-ioc';
import { MyInfoServiceFactory, MyInfoServiceLocal, MyInfoServiceMol } from '../myInfo.service';
import { User } from '../../../models';
import * as uuid from 'uuid';
import { getConfig } from '../../../config/app-config';

jest.mock('../../../tools/fetch');
jest.mock('../../../config/app-config');

describe('My Info Services', () => {
	const singpassMock = User.createSingPassUser('d080f6ed-3b47-478a-a6c6-dfb5608a199d', 'ABC1234');
	const anonymous = User.createAnonymousUser({ createdAt: new Date(), trackingId: uuid.v4() });
	const userMock = User.createAgencyUser({ agencyAppId: 'agency-first-app', agencyName: 'agency1' });
	const adminMock = User.createAdminUser({
		molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
		userName: 'UserName',
		email: 'test@email.com',
		name: 'Name',
		agencyUserId: 'ABC123',
	});

	const mockConfig = () => ({
		name: 'test',
		version: '0.1',
		port: 3000,
		env: 'production',
		database: {
			host: 'host',
			port: '1111',
			instance: 'database',
			username: 'user',
		},
		molRouteMyInfo: {
			url: '',
		},
		isLocal: false,
	});

	beforeEach(() => {
		jest.resetAllMocks();

		(getConfig as jest.Mock).mockImplementation(mockConfig);
	});

	it('should retrieve data from my info for SingPass user', async () => {
		await Container.get(MyInfoServiceMol).getMyInfo(singpassMock);
		expect(get).toBeCalledTimes(1);
	});

	it('should not retrieve data from my info for Anonymous User', async () => {
		await Container.get(MyInfoServiceMol).getMyInfo(anonymous);
		expect(get).toBeCalledTimes(0);
	});

	it('should not retrieve data from my info for Agency User', async () => {
		await Container.get(MyInfoServiceMol).getMyInfo(userMock);
		expect(get).toBeCalledTimes(0);
	});

	it('should not retrieve data from my info for Admin User', async () => {
		await Container.get(MyInfoServiceMol).getMyInfo(adminMock);
		expect(get).toBeCalledTimes(0);
	});

	describe('My Info local', () => {
		it('should retrieve data from my info for SingPass user', async () => {
			const result = await Container.get(MyInfoServiceLocal).getMyInfo(singpassMock);
			expect(result).toBeDefined();
		});

		it('should not retrieve data from my info for Anonymous User', async () => {
			const result = await Container.get(MyInfoServiceLocal).getMyInfo(anonymous);
			expect(result).not.toBeDefined();
		});
	});

	describe('My Info factory', () => {
		it('should retrieve Mol MyInfo service', async () => {
			(getConfig as jest.Mock).mockReturnValue({ ...mockConfig(), isLocal: false });

			const instance = await Container.get(MyInfoServiceFactory).getService();
			expect(instance).toBeInstanceOf(MyInfoServiceMol);
		});

		it('should retrieve Local MyInfo service', async () => {
			(getConfig as jest.Mock).mockReturnValue({ ...mockConfig(), isLocal: true });

			const instance = await Container.get(MyInfoServiceFactory).getService();
			expect(instance).toBeInstanceOf(MyInfoServiceLocal);
		});
	});
});
