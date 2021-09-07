import { Inject, InRequestScope } from 'typescript-ioc';
import { getConfig } from '../config/app-config';
import { AesEncryption } from './aesencryption';
import { KoaContextStore } from './koaContextStore.middleware';

export type AnonymousCookieData = {
	createdAt: Date;
	trackingId: string;
	booking?: string;
};

export type MobileOtpAddOnCookieData = {
	cookieCreatedAt: Date;
	otpReqId: string;
};

@InRequestScope
export class BookingSGCookieHelper {
	private static readonly CookieName = 'BookingSGToken';
	private static readonly stringEncoding = 'utf8';

	@Inject
	private _koaContextStore: KoaContextStore;
	private _encryptor: AesEncryption;

	constructor() {
		const config = getConfig();
		const key = Buffer.from(config.encryptionKey, 'base64');
		this._encryptor = new AesEncryption(key);
	}

	public setCookieValue(value: AnonymousCookieData) {
		const json = JSON.stringify(value);
		const encrypted = this._encryptor.encrypt(Buffer.from(json, BookingSGCookieHelper.stringEncoding));
		const config = getConfig();

		const koaContext = this._koaContextStore.koaContext;
		koaContext.cookies.set(BookingSGCookieHelper.CookieName, encrypted, {
			httpOnly: true,
			sameSite: config.isLocal ? false : 'lax',
			overwrite: true,
			secure: !config.isLocal,
		});
	}

	public getCookieValue(): AnonymousCookieData | undefined {
		try {
			const koaContext = this._koaContextStore.koaContext;
			const encrypted = koaContext.cookies.get(BookingSGCookieHelper.CookieName);
			if (!encrypted) {
				return undefined;
			}

			const decrypted = this._encryptor.decrypt(encrypted);
			const json = decrypted.toString(BookingSGCookieHelper.stringEncoding);
			return JSON.parse(json);
		} catch {
			return undefined;
		}
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
			sameSite: config.isLocal ? false : 'lax',
			overwrite: true,
			secure: !config.isLocal,
		});
	}
}

@InRequestScope
export class MobileOtpCookieHelper {
	private static readonly CookieName = 'MobileOtpAddOn';
	private static readonly stringEncoding = 'utf8';
	private _encryptor: AesEncryption;

	@Inject
	private _koaContextStore: KoaContextStore;

	constructor() {
		const config = getConfig();
		const key = Buffer.from(config.encryptionKey, 'base64');
		this._encryptor = new AesEncryption(key);
	}

	public setCookieValue(value: MobileOtpAddOnCookieData) {
		const json = JSON.stringify(value);
		const encrypted = this._encryptor.encrypt(Buffer.from(json, MobileOtpCookieHelper.stringEncoding));
		const config = getConfig();

		const koaContext = this._koaContextStore.koaContext;
		koaContext.cookies.set(MobileOtpCookieHelper.CookieName, encrypted, {
			httpOnly: true,
			sameSite: config.isLocal ? false : 'lax',
			overwrite: true,
			secure: !config.isLocal,
		});
	}

	public getCookieValue(): MobileOtpAddOnCookieData | undefined {
		try {
			const koaContext = this._koaContextStore.koaContext;
			const encrypted = koaContext.cookies.get(MobileOtpCookieHelper.CookieName);
			if (!encrypted) {
				return undefined;
			}

			const decrypted = this._encryptor.decrypt(encrypted);
			const json = decrypted.toString(MobileOtpCookieHelper.stringEncoding);
			return JSON.parse(json);
		} catch {
			return undefined;
		}
	}
}
