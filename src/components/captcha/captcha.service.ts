import { InRequestScope } from 'typescript-ioc';
import { GoogleVerifyApiRequest, GoogleVerifyApiRequestHeader, GoogleVerifyApiResponse } from './captcha.apicontract';
import { getConfig } from '../../config/app-config';
import { post } from '../../tools/fetch';

const RECATPCHA_URL = 'https://recaptchaenterprise.googleapis.com';
const RECAPTCHA_THRESHOLD = 0.5;

@InRequestScope
export class CaptchaService {
	public static async verify(token: string, origin: string): Promise<boolean> {
		if (token) {
			const config = getConfig();
			const apiKey = config.recaptchaApiKey;
			const siteKey = config.recaptchaSiteKey;
			const projectId = config.recaptchaProjectId;
			const res = await post<GoogleVerifyApiResponse>(
				`${RECATPCHA_URL}/v1beta1/projects/${projectId}/assessments?key=${apiKey}`,
				new GoogleVerifyApiRequest(token, siteKey),
				new GoogleVerifyApiRequestHeader(origin),
			);
			return res.tokenProperties.valid && res.score >= RECAPTCHA_THRESHOLD;
		}
		return false;
	}
}
