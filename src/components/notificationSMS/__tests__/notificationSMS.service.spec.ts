import { NotificationSMSService } from '../notificationSMS.service';
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
		(post as jest.Mock).mockImplementation(jest.fn())
	});

	it('Should call post when sending an sms', async () => {
		await Container.get(NotificationSMSService).send({ to: '8821 7161', message: '' });
		expect(post).toHaveBeenCalledTimes(1);
	});

	it('Should failed if international number', async () => {
		const res = async () => await NotificationSMSService.validatePhone('+44 8821 7160');
		await expect(res).rejects.toThrowErrorMatchingInlineSnapshot('"Invalid phone number"');
	});

	it('Should succeed if Singapore number', async () => {
		await NotificationSMSService.validatePhone('8821 7161');
		await NotificationSMSService.validatePhone('+65 8821 7160');
	});
});
