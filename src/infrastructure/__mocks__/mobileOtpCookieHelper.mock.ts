import { MobileOtpAddOnCookieData, MobileOtpCookieHelper } from '../bookingSGCookieHelper';

export class MobileOtpCookieHelperMock implements Partial<MobileOtpCookieHelper> {
	static getCookieValue = jest.fn<MobileOtpAddOnCookieData | undefined, any>();
	static setCookieValue = jest.fn();

	getCookieValue(): MobileOtpAddOnCookieData | undefined {
		return MobileOtpCookieHelperMock.getCookieValue();
	}

	setCookieValue(...params) {
		MobileOtpCookieHelperMock.setCookieValue(params);
	}
}
