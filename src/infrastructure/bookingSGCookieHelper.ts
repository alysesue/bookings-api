import { OtpRepository } from '../components/otp/otp.repository';
import { Inject, InRequestScope } from 'typescript-ioc';
import { getConfig } from '../config/app-config';
import { AesEncryption } from './aesencryption';
import { KoaContextStore } from './koaContextStore.middleware';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { DateHelper } from './dateHelper';

export type AnonymousCookieData = {
	createdAt: Date;
	trackingId: string;
	booking?: string;
};

export type MobileOtpAddOnCookieData = {
	cookieCreatedAt: Date;
	cookieRefreshedAt: Date;
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
	private static readonly CookieExpiryInMinutes = 20;
	private _encryptor: AesEncryption;

	@Inject
	private _koaContextStore: KoaContextStore;
	@Inject
	private otpRepository: OtpRepository;

	constructor() {
		const config = getConfig();
		const key = Buffer.from(config.encryptionKey, 'base64');
		this._encryptor = new AesEncryption(key);
	}

	public getCookieExpiry(): number {
		return MobileOtpCookieHelper.CookieExpiryInMinutes;
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
			maxAge: MobileOtpCookieHelper.CookieExpiryInMinutes * 60 * 1000,
		});
	}

	public async getValidCookieValue(): Promise<MobileOtpAddOnCookieData | undefined> {
		const cookie = this.getCookieValue();
		const otp = await this.otpRepository.getByOtpReqId(cookie.otpReqId);

		if (!otp) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(`Invalid request token.`);
		}

		this.isCookieValid(cookie);

		return cookie;
	}

	public isCookieValid(cookie: MobileOtpAddOnCookieData): void {
		const now = Date.now();
		const expiryDate = DateHelper.addMinutes(new Date(cookie.cookieRefreshedAt), this.getCookieExpiry()).getTime();

		if (now > expiryDate) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(`Invalid request, token expired.`);
		}
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
