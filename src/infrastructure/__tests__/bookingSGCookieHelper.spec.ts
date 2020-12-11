import { Container } from "typescript-ioc";
import { BookingSGCookieHelper } from "../bookingSGCookieHelper";
import { KoaContextStore } from "../KoaContextStore.middleware";
import * as Koa from 'koa';
import * as Cookies from 'cookies';
import { AesEncryption } from '../aesencryption';

jest.mock('../../config/app-config', () => {
	const configMock = {
		encryptionKey: '4hvph+8VIlDtm4e7e917gS1IyKbSYocKjylHsMdJYkg='
	};

	return {
		getConfig: () => configMock,
	};
});

jest.mock('../aesencryption');

describe('BookingSGCookieHelper tests', () => {
	const KoaContextStoreMock: Partial<KoaContextStore> = {
		koaContext: {
			cookies: {
				set: jest.fn(),
				get: jest.fn()
			} as Partial<Cookies>
		} as Koa.Context
	};

	const AesEncryptionMock: Partial<AesEncryption> = {
		encrypt: jest.fn(),
		decrypt: jest.fn()
	};

	beforeAll(() => {
		Container.bind(KoaContextStore).factory(() => KoaContextStoreMock);
	});

	beforeEach(() => {
		jest.resetAllMocks();
		(AesEncryption as jest.Mock).mockReturnValue(AesEncryptionMock);
	})

	it('should set cookie value', async () => {
		const cookieHelper = Container.get(BookingSGCookieHelper);
		const data = { createdAt: new Date(0), trackingId: '8db0ef50-2e3d-4eb8-83bf-16a8c9ea545f' };
		(AesEncryptionMock.encrypt as jest.Mock).mockImplementation(() => {
			return 'Some Encrypted Value';
		});

		cookieHelper.setCookieValue(data);

		expect(AesEncryptionMock.encrypt).toHaveBeenCalledWith(JSON.stringify(data));
		expect(KoaContextStoreMock.koaContext.cookies.set).toHaveBeenCalledWith(
			 'BookingSGToken',
			 'Some Encrypted Value',
			 {"httpOnly": true, "overwrite": true, "sameSite": "lax", "secure": true}
		);
	});

	it('should get cookie value', async () => {
		const cookieHelper = Container.get(BookingSGCookieHelper);
		const data = { createdAt: new Date(0), trackingId: '8db0ef50-2e3d-4eb8-83bf-16a8c9ea545f' };
		(AesEncryptionMock.decrypt as jest.Mock).mockImplementation(() => {
			return JSON.stringify(data);
		});

		(KoaContextStoreMock.koaContext.cookies.get as jest.Mock).mockReturnValue('cookie value');

		const result = cookieHelper.getCookieValue();
		expect(KoaContextStoreMock.koaContext.cookies.get).toHaveBeenCalled();
		expect(AesEncryptionMock.decrypt).toHaveBeenCalledWith('cookie value');

		expect(result).toBe(data);
	});
});
