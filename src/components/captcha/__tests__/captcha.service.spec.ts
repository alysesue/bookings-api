import { CaptchaService } from '../captcha.service';
import { GoogleVerifyApiResponse, TokenProperties } from '../captcha.apicontract';
import { postCaptcha } from '../../../tools/fetch';

jest.mock('../../../tools/fetch', () => ({
	postCaptcha: jest.fn(),
}));
describe('Captcha Service', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});
	it('should verify token to google captcha api', async () => {
		const tokenProps = {} as TokenProperties;
		tokenProps.valid = true;
		const returnVal = { tokenProperties: tokenProps } as GoogleVerifyApiResponse;
		(postCaptcha as jest.Mock).mockImplementation(() => Promise.resolve(returnVal));
		await CaptchaService.verify('123');
		expect(postCaptcha).toBeCalled();
	});

	it('should return false when no token is provided', async () => {
		const res = await CaptchaService.verify('');
		expect(res).toBe(false);
	});
});
