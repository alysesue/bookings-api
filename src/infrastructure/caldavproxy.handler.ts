// tslint:disable: tsr-detect-non-literal-regexp
import * as Koa from "koa";
import * as KoaProxy from "koa-proxy";
import { Inject, Singleton } from 'typescript-ioc';
import { GoogleApi } from "../googleapi/google.api";
import { basePath } from "../config/app-config";

@Singleton
export class CalDavProxyHandler {

	public httpProtocol: string = null;
	public httpHost: string = null;
	@Inject
	private googleApi: GoogleApi;
	private readonly koaProxy: any;
	private _initialized: boolean = false;
	private _calidUserRegex: RegExp;
	private _calidEventsRegex: RegExp;

	constructor() {
		this.koaProxy = KoaProxy({
			host: 'https://apidata.googleusercontent.com'
		});

		this._calidUserRegex = new RegExp(`^${basePath}/caldav/(.*)/user`);
		this._calidEventsRegex = new RegExp(`^${basePath}/caldav/(.*)/events`);
	}

	public build(): Koa.Middleware {
		return async (ctx: Koa.Context, next: Koa.Next): Promise<any> => {
			return await this.KoaMiddleware(ctx, next);
		};
	}

	private async koaProxyWithAuth(ctx: Koa.Context, next: Koa.Next): Promise<any> {
		ctx.originalUrl = ctx.url;

		const accessToken = await this.googleApi.getAccessToken();
		ctx.header['Authorization'] = `Bearer ${accessToken}`;

		return await this.koaProxy(ctx, next);
	}

	private async proxyCaldavUser(calid: string, ctx: Koa.Context, next: Koa.Next): Promise<any> {
		ctx.path = `/caldav/v2/${calid}/user`;
		return await this.koaProxyWithAuth(ctx, next);
	}

	private async proxyCaldavEvents(calid: string, ctx: Koa.Context, next: Koa.Next): Promise<any> {
		ctx.path = `/caldav/v2/${calid}/events`;
		return await this.koaProxyWithAuth(ctx, next);
	}

	private async KoaMiddleware(ctx: Koa.Context, next: Koa.Next): Promise<any> {
		if (!this._initialized) {
			this.httpHost = ctx.request.host;
			this.httpProtocol = ctx.request.protocol;

			this._initialized = true;
		}

		const calidUser = ctx.path.match(this._calidUserRegex)?.[1];
		if (calidUser) {
			return await this.proxyCaldavUser(calidUser, ctx, next);
		}

		const calidEvents = ctx.path.match(this._calidEventsRegex)?.[1];
		if (calidEvents) {
			return await this.proxyCaldavEvents(calidEvents, ctx, next);
		}

		return next();
	}
}
