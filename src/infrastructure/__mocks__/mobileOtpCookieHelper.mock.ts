import { MobileOtpAddOnCookieData, MobileOtpCookieHelper } from '../bookingSGCookieHelper';

export class MobileOtpCookieHelperMock implements Partial<MobileOtpCookieHelper> {
	static getCookieExpiry = jest.fn<number, any>();
	static getCookieValue = jest.fn<MobileOtpAddOnCookieData | undefined, any>();
	static setCookieValue = jest.fn();
	static getValidCookieValue = jest.fn<Promise<MobileOtpAddOnCookieData | undefined>, any>();
	static isCookieValid = jest.fn<void, any>();

	getCookieExpiry(): number {
		return MobileOtpCookieHelperMock.getCookieExpiry();
	}

	getCookieValue(): MobileOtpAddOnCookieData | undefined {
		return MobileOtpCookieHelperMock.getCookieValue();
	}

	setCookieValue(...params) {
		MobileOtpCookieHelperMock.setCookieValue(params);
	}

	getValidCookieValue(): Promise<MobileOtpAddOnCookieData | undefined> {
		return MobileOtpCookieHelperMock.getValidCookieValue();
	}

	isCookieValid(...params): void {
		MobileOtpCookieHelperMock.isCookieValid(params);
	}
}
