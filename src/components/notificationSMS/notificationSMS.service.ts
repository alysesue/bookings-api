import { MOLAuthType } from 'mol-lib-api-contract/auth/common/MOLAuthType';
import { post } from '../../tools/fetch';
import { getConfig } from '../../config/app-config';
import { smsLogger } from '../../config/logger';
import { InRequestScope, Inject } from 'typescript-ioc';
import { isPhoneNumberWithPrefix } from 'mol-lib-api-contract/utils';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { MOLSecurityHeaderKeys } from 'mol-lib-api-contract/auth';

export type SMSmessage = string;

export type SMS = {
	phoneNumber: string;
	message: SMSmessage;
};

export abstract class NotificationSMSService {
	public abstract send(sms: SMS, organisationName: string, agencyUserName: string): Promise<void>;

	public static async validatePhone(phone: string): Promise<void> {
		if (!(await isPhoneNumberWithPrefix(phone)).pass) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('Invalid phone number');
		}
	}
}

@InRequestScope
export class NotificationSMSServiceMol extends NotificationSMSService {
	private config = getConfig();

	public async send(sms: SMS, organisationName: string, agencyUserName: string): Promise<void> {
		const molNotifSvcUrl = this.config.molNotification.url;
		const prefix = `BSG-`;
		const header = {
			[MOLSecurityHeaderKeys.AUTH_TYPE]: MOLAuthType.SYSTEM,
			[MOLSecurityHeaderKeys.AGENCY_NAME]: prefix + (agencyUserName ? agencyUserName : organisationName),
		};
		// For mol notification service, they only enable real SMS sending on QE, STG and PROD env
		// Hence for BSG's local and dev env, we will point to their QE environment so that we can send out SMS (depending on our own env variables)
		// We only need to set the bypass header if we are trying to hit mol non-prod services via public URL
		if (this.isPublicMolUrl(molNotifSvcUrl)) {
			header['mol-token-bypass'] = 'true';
		}

		// For more details on how to call this API, refer to the code here: https://bitbucket.ship.gov.sg/projects/PUSH/repos/mol-notification/browse/src/sms/sms-controller.ts
		const path = molNotifSvcUrl + '/sms/api/v2/send-batch';
		await NotificationSMSService.validatePhone(sms.phoneNumber);
		try {
			await post(path, { sms: [sms] }, header);
		} catch (e) {
			smsLogger.error('Error sending sms', e);
			throw new MOLErrorV2(ErrorCodeV2.SYS_GENERIC).setMessage('Error sending sms').setHttpStatusCode(503); // use 503 Service Unavailable instead of generic 500
		}
	}

	// As long as we are making an API call that contains booking.gov.sg, it will be a public API.
	// An internal private API url should look like "http://notification-service.internal.qe:3000"
	private isPublicMolUrl(url: string): boolean {
		return url.includes('booking.gov.sg');
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
