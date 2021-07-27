import { get } from '../../../tools/fetch';
import { Container } from 'typescript-ioc';
import { MyInfoService } from '../myInfo.service';
import { User } from '../../../models';
import { mockConfig } from '../../../infrastructure/tests/mockConfig';
import * as uuid from 'uuid';

mockConfig();

jest.mock('../../../tools/fetch');
jest.mock('../../../config/app-config', () => {
	return {
		getConfig: () => ({
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
		}),
	};
});
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

	beforeAll(() => {
		(get as jest.Mock).mockImplementation(jest.fn());
	});
	beforeEach(() => {
		jest.resetAllMocks();
	});

	it('should retrieve data from my info for SingPass user', async () => {
		await Container.get(MyInfoService).getMyInfo(singpassMock);
		expect(get).toBeCalledTimes(1);
	});

	it('should not retrieve data from my info for Anonymous User', async () => {
		await Container.get(MyInfoService).getMyInfo(anonymous);
		expect(get).toBeCalledTimes(0);
	});

	it('should not retrieve data from my info for Agency User', async () => {
		await Container.get(MyInfoService).getMyInfo(userMock);
		expect(get).toBeCalledTimes(0);
	});

	it('should not retrieve data from my info for Admin User', async () => {
		await Container.get(MyInfoService).getMyInfo(adminMock);
		expect(get).toBeCalledTimes(0);
	});
});
