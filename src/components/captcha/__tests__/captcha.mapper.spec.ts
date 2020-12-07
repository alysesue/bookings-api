import { GoogleVerifyApiResponse } from '../captcha.apicontract';
import { CaptchaMapper } from '../captcha.mapper';

describe('Captcha Mapper', () => {
	it('should map Google captcha api response', () => {
		const input = {
			success: true,
			score: 0.9,
		} as GoogleVerifyApiResponse;
		const res = CaptchaMapper.mapToResponse(input);
		expect(res.success).toBe(true);
	});
});
