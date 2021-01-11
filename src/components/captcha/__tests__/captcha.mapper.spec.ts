import { GoogleVerifyApiResponse, TokenProperties } from '../captcha.apicontract';
import { CaptchaMapper } from '../captcha.mapper';

describe('Captcha Mapper', () => {
	it('should map Google captcha api response', () => {
		const tokenProperties = {
			valid: true,
		} as TokenProperties;
		const input = {
			tokenProperties,
			score: 0.9,
		} as GoogleVerifyApiResponse;
		const res = CaptchaMapper.mapToResponse(input);
		expect(res.success).toBe(true);
	});
});
