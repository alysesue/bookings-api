import { Container } from 'typescript-ioc';
import { BookingSGCookieHelper, MolCookieHelper } from '../bookingSGCookieHelper';
import { KoaContextStore } from '../koaContextStore.middleware';
import * as Koa from 'koa';
import * as Cookies from 'cookies';
import { AesEncryption } from '../aesencryption';
import { getConfig } from '../../config/app-config';

jest.mock('../../config/app-config');

jest.mock('../aesencryption');

describe('BookingSGCookieHelper tests', () => {
	const KoaContextStoreMock: Partial<KoaContextStore> = {
		koaContext: {
			cookies: {
				set: jest.fn(),
				get: jest.fn(),
			} as Partial<Cookies>,
		} as Koa.Context,
	};

	const AesEncryptionMock: Partial<AesEncryption> = {
		encrypt: jest.fn(),
		decrypt: jest.fn(),
	};

	beforeAll(() => {
		Container.bind(KoaContextStore).factory(() => KoaContextStoreMock);
	});

	beforeEach(() => {
		jest.resetAllMocks();
		(AesEncryption as jest.Mock).mockReturnValue(AesEncryptionMock);
		(getConfig as jest.Mock).mockReturnValue({
			encryptionKey: '4hvph+8VIlDtm4e7e917gS1IyKbSYocKjylHsMdJYkg=',
			isLocal: false,
		});
	});

	it('should set cookie value', async () => {
		const cookieHelper = Container.get(BookingSGCookieHelper);
		const data = { createdAt: new Date(0), trackingId: '8db0ef50-2e3d-4eb8-83bf-16a8c9ea545f' };
		(AesEncryptionMock.encrypt as jest.Mock).mockImplementation(() => {
			return 'Some Encrypted Value';
		});

		cookieHelper.setCookieValue(data);

		expect(KoaContextStoreMock.koaContext.cookies.set).toHaveBeenCalledWith(
			'BookingSGToken',
			'Some Encrypted Value',
			{ httpOnly: true, overwrite: true, sameSite: 'lax' },
		);
	});

	it('should set cookie value (when in dev)', async () => {
		(getConfig as jest.Mock).mockReturnValue({
			encryptionKey: '4hvph+8VIlDtm4e7e917gS1IyKbSYocKjylHsMdJYkg=',
			isLocal: true,
		});
		const cookieHelper = Container.get(BookingSGCookieHelper);
		const data = { createdAt: new Date(0), trackingId: '8db0ef50-2e3d-4eb8-83bf-16a8c9ea545f' };
		(AesEncryptionMock.encrypt as jest.Mock).mockImplementation(() => {
			return 'Some Encrypted Value';
		});

		cookieHelper.setCookieValue(data);

		expect(KoaContextStoreMock.koaContext.cookies.set).toHaveBeenCalledWith(
			'BookingSGToken',
			'Some Encrypted Value',
			{ httpOnly: true, overwrite: true, sameSite: false },
		);
	});

	it('should get cookie value', async () => {
		const cookieHelper = Container.get(BookingSGCookieHelper);
		const data = { createdAt: new Date(0), trackingId: '8db0ef50-2e3d-4eb8-83bf-16a8c9ea545f' };
		const json = JSON.stringify(data);
		(AesEncryptionMock.decrypt as jest.Mock).mockImplementation(() => {
			return json;
		});

		(KoaContextStoreMock.koaContext.cookies.get as jest.Mock).mockReturnValue('cookie value');

		const result = cookieHelper.getCookieValue();
		expect(KoaContextStoreMock.koaContext.cookies.get).toHaveBeenCalled();
		expect(AesEncryptionMock.decrypt).toHaveBeenCalledWith('cookie value');

		expect(result).toStrictEqual(JSON.parse(json));
	});

	it('should return undefined when cookie is not set', async () => {
		const cookieHelper = Container.get(BookingSGCookieHelper);
		const data = { createdAt: new Date(0), trackingId: '8db0ef50-2e3d-4eb8-83bf-16a8c9ea545f' };
		const json = JSON.stringify(data);
		(AesEncryptionMock.decrypt as jest.Mock).mockImplementation(() => {
			return json;
		});

		(KoaContextStoreMock.koaContext.cookies.get as jest.Mock).mockReturnValue(undefined);

		const result = cookieHelper.getCookieValue();
		expect(KoaContextStoreMock.koaContext.cookies.get).toHaveBeenCalled();
		expect(AesEncryptionMock.decrypt).not.toHaveBeenCalled();

		expect(result).toBe(undefined);
	});

	it('should delete mol bookie', async () => {
		const molCookieHelper = Container.get(MolCookieHelper);

		molCookieHelper.delete();

		expect(KoaContextStoreMock.koaContext.cookies.set).toHaveBeenCalledWith('MOLToken', undefined, {
			httpOnly: true,
			overwrite: true,
			sameSite: 'lax',
		});
	});

	it('should delete mol bookie (when in DEV)', async () => {
		(getConfig as jest.Mock).mockReturnValue({
			encryptionKey: '4hvph+8VIlDtm4e7e917gS1IyKbSYocKjylHsMdJYkg=',
			isLocal: true,
		});
		const molCookieHelper = Container.get(MolCookieHelper);

		molCookieHelper.delete();

		expect(KoaContextStoreMock.koaContext.cookies.set).toHaveBeenCalledWith('MOLToken', undefined, {
			httpOnly: true,
			overwrite: true,
			sameSite: false,
		});
	});
});