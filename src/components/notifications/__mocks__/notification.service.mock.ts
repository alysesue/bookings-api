import { NotificationsService } from '../notifications.service';
import { CreateEmailResponseDataApiDomain } from 'mol-lib-api-contract/notification/mail/create-email/create-email-api-domain';

export class NotificationsServiceMock implements Partial<NotificationsService> {
	public static sendEmailMock = jest.fn();
	public async sendEmail(...params): Promise<CreateEmailResponseDataApiDomain> {
		return NotificationsServiceMock.sendEmailMock(...params);
	}
}
