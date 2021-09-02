import { MobileOtpAddOnCookieData, MobileOtpCookieHelper } from '../bookingSGCookieHelper';

export class MobileOtpCookieHelperMock implements Partial<MobileOtpCookieHelper> {
	static getCookieExpiry = jest.fn<number, any>();
	static getCookieValue = jest.fn<MobileOtpAddOnCookieData | undefined, any>();
	static setCookieValue = jest.fn();

	getCookieExpiry(): number {
		return MobileOtpCookieHelperMock.getCookieExpiry();
	}

	getCookieValue(): MobileOtpAddOnCookieData | undefined {
		return MobileOtpCookieHelperMock.getCookieValue();
	}

	setCookieValue(...params) {
		MobileOtpCookieHelperMock.setCookieValue(params);
	}
}
