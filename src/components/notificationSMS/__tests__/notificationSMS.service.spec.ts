import { NotificationSMSService } from '../notificationSMS.service';
import { Container } from 'typescript-ioc';
import { post } from '../../../tools/fetch';
import '../../../infrastructure/tests/mockConfig';
import { mockConfig } from '../../../infrastructure/tests/mockConfig';

mockConfig();

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

describe('Test of notification SMS', () => {
	beforeAll(() => {});

	it('Should call post when sending an sms', async () => {
		await Container.get(NotificationSMSService).send({ to: '', message: '' });
		expect(post).toHaveBeenCalledTimes(1);
	});
});
