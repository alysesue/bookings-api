import { Inject, InRequestScope } from 'typescript-ioc';
import { logger } from 'mol-lib-common';
import { getConfig } from '../../config/app-config';
import { post } from '../../tools/fetch';
import { GoogleVerifyApiRequest, GoogleVerifyApiResponse } from './captcha.apicontract';
import { KoaContextStore } from '../../infrastructure/koaContextStore.middleware';

const RECAPTCHA_THRESHOLD = 0.5;

@InRequestScope
export class CaptchaService {
	@Inject
	private _koaContextStore: KoaContextStore;

	public async verify(token: string): Promise<boolean> {
		const config = getConfig();
		if (config.isAutomatedTest) {
			return true;
		}

		const koaContext = this._koaContextStore.koaContext;
		const origin = koaContext.header.origin;

		if (token) {
			const googleApiKey = config.recaptchaApiKey;
			const siteKey = config.recaptchaSiteKey;
			const projectId = config.recaptchaProjectId;
			const apigatewayApiKey = config.runtimeInjectedVariables.awsApigatewayApiKey;
			const res = await post<GoogleVerifyApiResponse>(
				`${config.runtimeInjectedVariables.recaptchaEndpoint}/recaptcha/v1beta1/projects/${projectId}/assessments?key=${googleApiKey}`,
				new GoogleVerifyApiRequest(token, siteKey),
				{ referer: origin, 'x-api-key': apigatewayApiKey },
			);
			const result = res.tokenProperties.valid && res.score && res.score >= RECAPTCHA_THRESHOLD;
			if (!result) {
				logger.warn(`Captcha failed:`, res);
			}
			return result;
		}
		return false;
	}
}
