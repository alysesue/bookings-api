import { Container, Snapshot } from 'typescript-ioc';
import { CalDavProxyHandler } from '../caldavproxy.handler';
import { Context } from "koa";
import * as KoaProxy from 'koa-proxy';
import { GoogleCalendarService } from '../../googleapi/google.calendar.service';
import { GoogleApi } from "../../googleapi/google.api";
import { basePath } from "../../config/app-config";


beforeEach(() => {
	// Clears mock counters, not implementation
	jest.clearAllMocks();
});

jest.mock('koa-proxy', () => {
	const koaProxyMiddleware = jest.fn(() => Promise.resolve());

	return jest.fn(() => koaProxyMiddleware);
});

const GoogleApiMock = {
	getAccessToken: jest.fn(() => Promise.resolve('test_access_token'))
};

function buildSampleKoaContext(path: string): Context {
	return {
		path,
		header: {},
		request: { host: 'localhost', protocol: 'http' }
	} as Context;
}

describe('Caldav proxy tests', () => {
	it('should redirect caldav users request', async () => {
		Container.bind(GoogleApi).to(jest.fn(() => GoogleApiMock));

		const handler = new CalDavProxyHandler();
		const middleware = handler.build();
		const koaProxyMiddleware = KoaProxy();

		const nextMiddleware = jest.fn().mockImplementation(() => Promise.resolve());
		const context = buildSampleKoaContext(`${basePath}/caldav/jbrhqc65lfv77daijqcjl9bgak%40group.calendar.google.com/user`);

		await middleware(context, nextMiddleware);

		expect(GoogleApiMock.getAccessToken).toBeCalled();
		expect(koaProxyMiddleware).toBeCalled();
		expect(nextMiddleware).not.toBeCalled();

		expect(context.path).toBe('/caldav/v2/jbrhqc65lfv77daijqcjl9bgak%40group.calendar.google.com/user');
		expect(context.header['Authorization']).toBe('Bearer test_access_token');
	});

	it('should redirect caldav events request', async () => {
		Container.bind(GoogleApi).to(jest.fn(() => GoogleApiMock));

		const handler = new CalDavProxyHandler();
		const middleware = handler.build();
		const koaProxyMiddleware = KoaProxy();

		const nextMiddleware = jest.fn().mockImplementation(() => Promise.resolve());
		const context = buildSampleKoaContext(`${basePath}/caldav/jbrhqc65lfv77daijqcjl9bgak%40group.calendar.google.com/events`);

		await middleware(context, nextMiddleware);

		expect(GoogleApiMock.getAccessToken).toBeCalled();
		expect(koaProxyMiddleware).toBeCalled();
		expect(nextMiddleware).not.toBeCalled();

		expect(context.path).toBe('/caldav/v2/jbrhqc65lfv77daijqcjl9bgak%40group.calendar.google.com/events');
		expect(context.header['Authorization']).toBe('Bearer test_access_token');
	});

	it('should not redirect ordinary requests', async () => {
		Container.bind(GoogleCalendarService).to(jest.fn(() => GoogleApiMock));

		const handler = new CalDavProxyHandler();
		const middleware = handler.build();
		const koaProxyMiddleware = KoaProxy();

		const nextMiddleware = jest.fn().mockImplementation(() => Promise.resolve());
		const context = buildSampleKoaContext('/health');

		await middleware(context, nextMiddleware);

		expect(GoogleApiMock.getAccessToken).not.toBeCalled();
		expect(koaProxyMiddleware).not.toBeCalled();
		expect(nextMiddleware).toBeCalled();

		expect(context.path).toBe('/health');
	});

	it('should not redirect invalid caldav url', async () => {
		Container.bind(GoogleCalendarService).to(jest.fn(() => GoogleApiMock));

		const handler = new CalDavProxyHandler();
		const middleware = handler.build();
		const koaProxyMiddleware = KoaProxy();

		const nextMiddleware = jest.fn().mockImplementation(() => Promise.resolve());
		const context = buildSampleKoaContext(`${basePath}/caldav/jbrhqc65lfv77daijqcjl9bgak%40group.calendar.google.com/wrongurl`);

		await middleware(context, nextMiddleware);

		expect(GoogleApiMock.getAccessToken).not.toBeCalled();
		expect(koaProxyMiddleware).not.toBeCalled();
		expect(nextMiddleware).toBeCalled();

		expect(context.path).toBe(`${basePath}/caldav/jbrhqc65lfv77daijqcjl9bgak%40group.calendar.google.com/wrongurl`);
	});
});
