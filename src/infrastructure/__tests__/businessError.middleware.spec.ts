import { basePath } from '../../config/app-config';
import * as Koa from 'koa';
import { BusinessErrorMiddleware } from '../businessError.middleware';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { BusinessValidation } from '../../models';
import { BusinessError } from '../../errors/businessError';

afterEach(() => {
	jest.resetAllMocks();
});

function buildSampleKoaContext(path: string): Koa.Context {
	return {
		path,
		header: {},
		request: { host: 'localhost', protocol: 'http' },
		response: { body: undefined, status: undefined },
	} as Koa.Context;
}

describe('Business error context test', () => {
	it('should execute next middleware', async () => {
		const handler = new BusinessErrorMiddleware();
		const errorMiddleware = handler.build();

		const nextMiddleware: Koa.Next = jest.fn(() => Promise.resolve());
		const context = buildSampleKoaContext(`${basePath}/someapi`);
		context.response.body = {};

		await errorMiddleware(context, nextMiddleware);

		expect(nextMiddleware).toBeCalled();
		expect(context.response.body).toEqual({});
	});

	it('should not intercept unexpected exception', async () => {
		const handler = new BusinessErrorMiddleware();
		const errorMiddleware = handler.build();

		const nextMiddleware: Koa.Next = jest.fn(async () => {
			throw new Error('Some error');
		});

		const context = buildSampleKoaContext(`${basePath}/someapi`);
		context.response.body = {};

		const test = async () => await errorMiddleware(context, nextMiddleware);
		expect(test).rejects.toMatchInlineSnapshot('[Error: Some error]');
		expect(context.response.body).toEqual({});
	});

	it('should not intercept MolError', async () => {
		const handler = new BusinessErrorMiddleware();
		const errorMiddleware = handler.build();

		const nextMiddleware: Koa.Next = jest.fn(async () => {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('error message');
		});

		const context = buildSampleKoaContext(`${basePath}/someapi`);
		context.response.body = {};

		const test = async () => await errorMiddleware(context, nextMiddleware);
		expect(test).rejects.toMatchInlineSnapshot('[SYS_INVALID_PARAM (400): error message]');
		expect(context.response.body).toEqual({});
	});

	it('should intercept and serialise business error', async () => {
		const handler = new BusinessErrorMiddleware();
		const errorMiddleware = handler.build();

		const validations = [
			new BusinessValidation({ code: '1', message: 'validation1' }),
			new BusinessValidation({ code: '2', message: 'validation2' }),
		];

		const nextMiddleware: Koa.Next = jest.fn(async () => {
			BusinessError.throw(validations);
		});

		const context = buildSampleKoaContext(`${basePath}/someapi`);
		context.response.body = {};

		await errorMiddleware(context, nextMiddleware);
		expect(context.response.body).toEqual({
			data: [
				{
					code: '1',
					message: 'validation1',
				},
				{
					code: '2',
					message: 'validation2',
				},
			],
			errorCode: 'SYS_INVALID_PARAM',
			errorMessage: 'One or more business validations failed',
			errorName: 'BusinessError',
		});
	});
});
