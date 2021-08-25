import { post } from '../../tools/fetch';
import { getConfig } from '../../config/app-config';
import { smsLogger } from '../../config/logger';
import { InRequestScope, Inject } from 'typescript-ioc';
import { isPhoneNumberWithPrefix } from 'mol-lib-api-contract/utils';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';

export type SMSmessage = string;

export type SMS = {
	phoneNumber: string;
	message: SMSmessage;
};

export abstract class NotificationSMSService {
	public abstract send(sms: SMS): Promise<void>;

	public static async validatePhone(phone: string): Promise<void> {
		if (!(await isPhoneNumberWithPrefix(phone)).pass) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('Invalid phone number');
		}
	}
}

@InRequestScope
export class NotificationSMSServiceMol extends NotificationSMSService {
	private config = getConfig();

	public async send(sms: SMS): Promise<void> {
		const header = { 'mol-auth-type': 'SYSTEM', 'mol-token-bypass': 'true' };
		// Because this is a hidden API from mol-notification service, there's no public documentation to link to
		// Link to the controller code is here: https://bitbucket.ship.gov.sg/projects/PUSH/repos/mol-notification/browse/src/sms/sms-controller.ts
		const path = this.config.molNotification.url + '/sms/api/v2/send-batch';
		await NotificationSMSService.validatePhone(sms.phoneNumber);
		try {
			await post(path, { sms: [sms] }, header);
		} catch (e) {
			smsLogger.error('Error sending sms', e);
			throw new MOLErrorV2(ErrorCodeV2.SYS_GENERIC).setMessage('Error sending sms').setHttpStatusCode(503); // use 503 Service Unavailable instead of generic 500
		}
	}
}

@InRequestScope
export class NotificationSMSServiceLocal extends NotificationSMSService {
	public send(sms: SMS): Promise<void> {
		smsLogger.info(`Sending SMS: ${JSON.stringify(sms)}`);
		return Promise.resolve();
	}
}

@InRequestScope
export class NotificationSMSServiceFactory {
	@Inject
	private _molService: NotificationSMSServiceMol;
	@Inject
	private _localService: NotificationSMSServiceLocal;

	public getService(): NotificationSMSService {
		return getConfig().smsEnabled ? this._molService : this._localService;
	}
}
