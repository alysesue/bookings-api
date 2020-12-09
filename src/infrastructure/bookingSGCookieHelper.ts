import { AesEncryption } from './aesencryption';
import { getConfig } from '../config/app-config';
import { Inject, InRequestScope } from 'typescript-ioc';
import { KoaContextStore } from './KoaContextStore.middleware';

export type AnonymousCookieData = {
	createdAt: Date;
	trackingId: string;
}

@InRequestScope
export class BookingSGCookieHelper {
	private static readonly CookieName = 'BookingSGToken';
	private static readonly stringEncoding = 'utf8';

	@Inject
	private _koaContextStore: KoaContextStore;
	private _encryptor: AesEncryption;

	constructor() {
		const config = getConfig();
		this._encryptor = new AesEncryption(config.encryptionKey, 'base64');
	}

	public setCookieValue(value: AnonymousCookieData) {
		const json = JSON.stringify(value);
		const encrypted = this._encryptor.encrypt(Buffer.from(json, BookingSGCookieHelper.stringEncoding));
		const config = getConfig();

		const koaContext = this._koaContextStore.koaContext;
		koaContext.cookies.set(BookingSGCookieHelper.CookieName, encrypted, {
			httpOnly: true,
			secure: !config.isDev,
			sameSite: config.isDev ? false : 'lax',
			overwrite: true,
		});
	}

	public getCookieValue(): AnonymousCookieData | undefined {
		const koaContext = this._koaContextStore.koaContext;
		const encrypted = koaContext.cookies.get(BookingSGCookieHelper.CookieName);
		if (!encrypted) {
			return undefined;
		}

		const decrypted = this._encryptor.decrypt(encrypted);
		const json = decrypted.toString(BookingSGCookieHelper.stringEncoding);
		return JSON.parse(json);
	}
}

@InRequestScope
export class MolCookieHelper {
	private static readonly CookieName = 'MOLToken';

	@Inject
	private _koaContextStore: KoaContextStore;

	public delete() {
		const koaContext = this._koaContextStore.koaContext;
		const config = getConfig();

		koaContext.cookies.set(MolCookieHelper.CookieName, undefined, {
			httpOnly: true,
			secure: !config.isDev,
			sameSite: config.isDev ? false : 'lax',
			overwrite: true,
		});
	}
}
