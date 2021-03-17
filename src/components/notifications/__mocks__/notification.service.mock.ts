import { NotificationsService } from '../notifications.service';

export class NotificationsServiceMock extends NotificationsService {
	public static sendEmailMock = jest.fn();
	public async sendEmail(...params): Promise<void> {
		NotificationsServiceMock.sendEmailMock(...params);
	}
}
