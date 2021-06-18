import { post } from '../../tools/fetch';
import { getConfig } from '../../config/app-config';
import { smsLogger } from '../../config/logger';
import { InRequestScope } from 'typescript-ioc';
import { isSGPhoneNumber } from "mol-lib-api-contract/utils";
import { ErrorCodeV2, MOLErrorV2 } from "mol-lib-api-contract";

export type SMSmessage = string;

export type SMS = {
	to: string;
	message: SMSmessage;
};

@InRequestScope
export class NotificationSMSService {
	private config = getConfig();

	public async send(sms: SMS) {
		const header = { 'mol-auth-type': 'SYSTEM', 'mol-token-bypass': true };
		const path = this.config.molNotification.url + '/sms/api/v1/send-one';
		await NotificationSMSService.validatePhone(sms.to);
		try {
			await post(path, sms, header);
		} catch (e) {
			smsLogger.error('Error sending sms', e);
		}
	}

	public static validatePhone = async (phone: string): Promise<void> => {
		if (!(await isSGPhoneNumber(phone)).pass) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('Invalid phone number');
		}
	};

}
