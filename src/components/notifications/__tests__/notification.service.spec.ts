import { post } from '../../../tools/fetch';
import { Container } from 'typescript-ioc';
import { NotificationsService } from '../notifications.service';

jest.mock('../../../tools/fetch');
jest.mock('../../../config/app-config', () => {
	const configMock = { isLocal: true, molNotification: { url: '' } };

	return {
		getConfig: () => configMock,
	};
});

describe('Test notification service', () => {
	it('Should test if post is called', async () => {
		const instance = await Container.get(NotificationsService);
		instance.sendEmail({ to: [''], subject: '', html: '' });
		expect(post).toHaveBeenCalledTimes(1);
	});
});
