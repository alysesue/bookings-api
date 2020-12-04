import { Container } from "typescript-ioc";
import { CaptchaService } from "../captcha.service";
import { GoogleVerifyApiResponse } from "../captcha.apicontract";
import { post } from "../../../interface";


jest.mock('../../../interface', () => ({
	post: jest.fn(),
}));
describe('Captcha Service', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});
	it('should verify token to google captcha api', async () => {
		const returnVal = { success: true } as GoogleVerifyApiResponse;
		(post as jest.Mock).mockImplementation(() => Promise.resolve(returnVal));
		await CaptchaService.verify("123");
		expect(post).toBeCalled();
	});

	it('should return false when no token is provided', async () => {
		const res = await CaptchaService.verify("");
		expect(res).toBe(false);
	});


})

