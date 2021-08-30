import { NotificationSMSService, NotificationSMSServiceMol } from '../notificationSMS.service';
import { Container } from 'typescript-ioc';
import { post } from '../../../tools/fetch';
import '../../../infrastructure/tests/mockConfig';
import { mockConfig } from '../../../infrastructure/tests/mockConfig';

mockConfig();
jest.mock('../../../tools/fetch');

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

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
			molNotification: {
				url: '',
			},
		}),
	};
});

describe('Test of notification SMS', () => {
	beforeAll(() => {
		(post as jest.Mock).mockImplementation(jest.fn());
	});

	it('Should call post when sending an sms', async () => {
		await Container.get(NotificationSMSServiceMol).send({ phoneNumber: '+6588217161', message: '' });
		expect(post).toHaveBeenCalledTimes(1);
	});

	it("Should fail if there's no country code", async () => {
		const res = async () => await NotificationSMSService.validatePhone('88217161');
		await expect(res).rejects.toThrowErrorMatchingInlineSnapshot('"Invalid phone number"');
	});

	it('Should succeed if Singapore or international number', async () => {
		await NotificationSMSService.validatePhone('+4488217160');
		await NotificationSMSService.validatePhone('+6588217160');
	});
});
