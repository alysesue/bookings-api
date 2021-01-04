import { InRequestScope } from 'typescript-ioc';
import { GoogleVerifyApiResponse, GoogleVerifyApiRequest } from './captcha.apicontract';
import { getConfig } from '../../config/app-config';
import { postCaptcha } from '../../tools/fetch';

const RECATPCHA_URL = 'https://recaptchaenterprise.googleapis.com';
const RECAPTCHA_THRESHOLD = 0.5;

@InRequestScope
export class CaptchaService {
	public static async verify(token: string): Promise<boolean> {
		if (token) {
			const apiKey = getConfig().recaptchaApiKey;
			const siteKey = getConfig().recaptchaSiteKey;
			const projectId = getConfig().recaptchaProjectId;
			const res = await postCaptcha<GoogleVerifyApiResponse>(
				`${RECATPCHA_URL}/v1beta1/projects/${projectId}/assessments?key=${apiKey}`,
				new GoogleVerifyApiRequest(token, siteKey)

			);
			return res.tokenProperties.valid && res.score >= RECAPTCHA_THRESHOLD;
		}
		return false;
	}
}
