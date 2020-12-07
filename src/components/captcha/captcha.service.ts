import { InRequestScope } from 'typescript-ioc';
import { post } from '../../interface';
import { GoogleVerifyApiResponse } from './captcha.apicontract';
import { getConfig } from '../../config/app-config';

const RECATPCHA_URL = 'https://www.google.com/recaptcha/api/siteverify';
const RECAPTCHA_THRESHOLD = 0.5;

@InRequestScope
export class CaptchaService {
	public static async verify(token: string): Promise<boolean> {
		if (token) {
			const secretKey = getConfig().recaptchaKey;
			const res = await post<GoogleVerifyApiResponse>(
				`${RECATPCHA_URL}?secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(token)}`,
			);
			return res.success && res.score >= RECAPTCHA_THRESHOLD;
		}
		return false;
	}
}
