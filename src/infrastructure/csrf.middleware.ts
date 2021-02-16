import { getConfig } from '../config/app-config';
import * as Koa from 'koa';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import * as uuid from 'uuid';
import { ContainerContextMiddleware } from './containerContext.middleware';
import { UserContext } from './auth/userContext';
import * as jose from 'node-jose';
import { AsyncLazy } from '../tools/asyncLazy';
import { JwtUtils } from 'mol-lib-common';
import { User } from '../models';
import { DateHelper } from './dateHelper';

const config = getConfig();

export const XSRF_HEADER_NAME = 'x-xsrf-token';

type JWTCsrf = {
	type: string;
	cookieName: string;
	uuid: string;
	userId: number;
	expiryDate: Date;
};

export const METHODS_TO_VERIFY_TOKEN = ['post', 'put', 'delete', 'patch'];
export const METHODS_TO_CREAT_TOKEN = ['head'];

const getCurrentUser = async (ctx: Koa.Context): Promise<User> => {
	const containerContext = ContainerContextMiddleware.getContainerContext(ctx);
	const userContext = containerContext.resolve(UserContext);
	return userContext.getCurrentUser();
};

export class CreateCsrfMiddleware {
	private _lazyKey = new AsyncLazy<jose.JWK.Key>(() => JwtUtils.createSymmetricKey(config.csrfSecret));

	private async createJwtToken(payload: JWTCsrf): Promise<string> {
		const key = await this._lazyKey.getValue();
		return await JwtUtils.encryptJwe(key, JSON.stringify(payload));
	}

	private async createTokens(ctx: Koa.Context) {
		const user = await getCurrentUser(ctx);
		const userId = user?.id;
		if ((user && user.isAgency()) || !userId) {
			return;
		}

		const cookieName = `x-${uuid.v4()}`;
		const cookiePayload: JWTCsrf = {
			type: 'cookie',
			uuid: uuid.v4(),
			userId,
			cookieName,
			expiryDate: DateHelper.addMinutes(new Date(), 1),
		};

		const jwtCookie = await this.createJwtToken(cookiePayload);
		const jwtHeader = await this.createJwtToken({ ...cookiePayload, type: 'header' });

		ctx.cookies.set(cookieName, jwtCookie, {
			httpOnly: true,
			sameSite: config.isLocal ? false : 'lax',
			maxAge: 10 * 60 * 1000,
			overwrite: true,
		});
		ctx.set(XSRF_HEADER_NAME, jwtHeader);
		ctx.status = 200;
	}

	public build(): Koa.Middleware {
		return async (ctx: Koa.Context, next: Koa.Next): Promise<any> => {
			if (METHODS_TO_CREAT_TOKEN.includes(ctx.request.method.toLowerCase())) {
				await this.createTokens(ctx);
				return;
			}
			return await next();
		};
	}
}

export class VerifyCsrfMiddleware {
	private _lazyKey = new AsyncLazy<jose.JWK.Key>(() => JwtUtils.createSymmetricKey(config.csrfSecret));

	private async readJwtToken(value: string): Promise<JWTCsrf> {
		const key = await this._lazyKey.getValue();
		const result = await JwtUtils.decryptJwe(key, value);
		const decrypted = JSON.parse(result.payload.toString('utf8')) as JWTCsrf;
		if (decrypted.expiryDate < new Date()) {
			return {} as JWTCsrf;
		}
		return decrypted;
	}

	private getAndClearValue(ctx: Koa.Context, cookieName: string) {
		const value = ctx.cookies.get(cookieName);
		ctx.cookies.set(cookieName, undefined, {
			httpOnly: true,
			sameSite: config.isLocal ? false : 'lax',
			overwrite: true,
		});

		return value;
	}

	private async verifyToken(ctx: Koa.Context): Promise<void> {
		const user = await getCurrentUser(ctx);
		if (user && user.isAgency()) {
			return;
		}

		const userId = user?.id;
		let cookieDecoded: JWTCsrf;
		let headerDecoded: JWTCsrf;
		try {
			const jwtHeader = ctx.get(XSRF_HEADER_NAME);
			headerDecoded = await this.readJwtToken(jwtHeader);

			if (headerDecoded.cookieName) {
				const jwtCookie = this.getAndClearValue(ctx, headerDecoded.cookieName);
				cookieDecoded = await this.readJwtToken(jwtCookie);
			}
		} catch (e) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(`Invalid csrf token`);
		}

		if (
			cookieDecoded.type !== 'cookie' ||
			headerDecoded.type !== 'header' ||
			cookieDecoded.uuid !== headerDecoded.uuid ||
			cookieDecoded.userId !== headerDecoded.userId ||
			cookieDecoded.userId !== userId
		) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(`Invalid csrf token`);
		}
	}

	public build(): Koa.Middleware {
		return async (ctx: Koa.Context, next: Koa.Next): Promise<any> => {
			if (METHODS_TO_VERIFY_TOKEN.includes(ctx.request.method.toLowerCase()) && !config.isAutomatedTest) {
				await this.verifyToken(ctx);
			}
			return await next();
		};
	}
}
