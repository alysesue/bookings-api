import * as Koa from 'koa';
import { CaptchaService } from '../captcha.service';
import { GoogleVerifyApiResponse } from '../captcha.apicontract';
import { getConfig } from '../../../config/app-config';
import { post } from '../../../tools/fetch';
import { Container } from 'typescript-ioc';
import { KoaContextStore } from '../../../infrastructure/koaContextStore.middleware';

jest.mock('../../../config/app-config');

jest.mock('../../../tools/fetch', () => ({
	post: jest.fn(),
}));

describe('Captcha Service', () => {
	const KoaContextStoreMock: Partial<KoaContextStore> = {
		koaContext: {
			header: {} as Partial<Headers>,
		} as any as Koa.Context,
	};
	beforeAll(() => {
		Container.bind(KoaContextStore).factory(() => KoaContextStoreMock);
	});
	beforeEach(() => {
		jest.clearAllMocks();
		KoaContextStoreMock.koaContext.header.origin = '';

		(getConfig as jest.Mock).mockReturnValue({
			recaptchaApiKey: '',
			recaptchaProjectId: '',
			recaptchaSiteKey: '',
			isAutomatedTest: false,
		});
	});

	it('should verify token to google captcha api', async () => {
		const returnVal = {
			tokenProperties: {
				valid: true,
			},
			score: 0.8,
		} as Partial<GoogleVerifyApiResponse>;
		(post as jest.Mock).mockImplementation(() => Promise.resolve(returnVal));
		KoaContextStoreMock.koaContext.header.origin = 'www.local.booking.gov.sg';

		const res = await Container.get(CaptchaService).verify('123');
		expect(res).toBe(true);
		expect(post).toBeCalled();
	});

	it('should return true for automated tests', async () => {
		(getConfig as jest.Mock).mockReturnValue({
			recaptchaApiKey: '',
			recaptchaProjectId: '',
			recaptchaSiteKey: '',
			isAutomatedTest: true,
		});

		expect(await Container.get(CaptchaService).verify('123')).toBe(true);
		expect(await Container.get(CaptchaService).verify('')).toBe(true);
	});

	it('should return false for invalid respose', async () => {
		const returnVal = {
			tokenProperties: {
				valid: false,
			},
		} as Partial<GoogleVerifyApiResponse>;
		(post as jest.Mock).mockImplementation(() => Promise.resolve(returnVal));
		KoaContextStoreMock.koaContext.header.origin = 'www.local.booking.gov.sg';

		const res = await Container.get(CaptchaService).verify('123');
		expect(res).toBe(false);
		expect(post).toBeCalled();
	});

	it('should return false for value below threshold', async () => {
		const returnVal = {
			tokenProperties: {
				valid: true,
			},
			score: 0.4,
		} as Partial<GoogleVerifyApiResponse>;
		(post as jest.Mock).mockImplementation(() => Promise.resolve(returnVal));
		KoaContextStoreMock.koaContext.header.origin = 'www.local.booking.gov.sg';

		const res = await Container.get(CaptchaService).verify('123');
		expect(res).toBe(false);
		expect(post).toBeCalled();
	});

	it('should return false when no token is provided', async () => {
		const res = await Container.get(CaptchaService).verify('');
		expect(post).not.toBeCalled();
		expect(res).toBe(false);
	});
});
