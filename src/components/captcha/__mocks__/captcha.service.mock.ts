import { CaptchaService } from '../captcha.service';

export class CaptchaServiceMock implements Partial<CaptchaService> {
	public static verify = jest.fn<Promise<boolean>, any>();

	public async verify(...params): Promise<any> {
		return await CaptchaServiceMock.verify(...params);
	}
}
