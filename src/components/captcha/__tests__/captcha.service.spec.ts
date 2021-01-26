import { CaptchaService } from '../captcha.service';
import { GoogleVerifyApiResponse, TokenProperties } from '../captcha.apicontract';
import { getConfig } from '../../../config/app-config';
import { post } from '../../../tools/fetch';

jest.mock('../../../config/app-config');

jest.mock('../../../tools/fetch', () => ({
	post: jest.fn(),
}));

describe('Captcha Service', () => {
	beforeEach(() => {
		jest.clearAllMocks();

		(getConfig as jest.Mock).mockReturnValue({
			recaptchaApiKey: '',
			recaptchaProjectId: '',
			recaptchaSiteKey: '',
		});
	});

	it('should verify token to google captcha api', async () => {
		const tokenProps = {} as TokenProperties;
		tokenProps.valid = true;
		const returnVal = { tokenProperties: tokenProps } as GoogleVerifyApiResponse;
		(post as jest.Mock).mockImplementation(() => Promise.resolve(returnVal));
		await CaptchaService.verify('123', 'local.booking.gov.sg');
		expect(post).toBeCalled();
	});

	it('should return false when no token is provided', async () => {
		const res = await CaptchaService.verify('', '');
		expect(res).toBe(false);
	});
});
