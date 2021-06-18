import { post } from '../../tools/fetch';
import { getConfig } from '../../config/app-config';
import { smsLogger } from '../../config/logger';
import { InRequestScope } from 'typescript-ioc';

export type SMSmessage = string;

export type SMS = {
	to: string;
	message: SMSmessage;
};

@InRequestScope
export class NotificationSMSService {
	private config = getConfig();

	public async send(sms: SMS) {
		const path = this.config.molNotification.url + '/sms/api/v1/send-one';
		try {
			await post(path, sms);
		} catch (e) {
			smsLogger.error('Error sending sms', e);
		}
	}
}
