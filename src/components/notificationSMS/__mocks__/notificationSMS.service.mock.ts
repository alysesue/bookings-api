import { NotificationSMSService } from '../notificationSMS.service';

export class NotificationSMSServiceMock implements Partial<NotificationSMSService> {
	public static sendMock = jest.fn();
	public async send(...params): Promise<void> {
		return NotificationSMSServiceMock.sendMock(...params);
	}
}
