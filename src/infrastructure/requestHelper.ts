import { Controller } from 'tsoa';
import * as Koa from 'koa';

export type RawHeaders = { [key: string]: string };

export interface IHeaderCollection {
	get(name: string): string;
	all(): RawHeaders;
}

class HeaderCollection implements IHeaderCollection {
	private _headers: any;

	public constructor(headers: any) {
		this._headers = headers || {};
	}

	public get(name: string): string {
		return this._headers[name];
	}

	public all(): RawHeaders {
		return this._headers;
	}
}

export const getRequestHeaders = (controller: Controller): IHeaderCollection => {
	// Koa context is set in the generated routes code.
	const koaContext = (controller as any).context as Koa.Context;
	return new HeaderCollection(koaContext.request.headers);
};
