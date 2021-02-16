import * as Koa from 'koa';
import { CreateCsrfMiddleware, VerifyCsrfMiddleware } from '../csrf.middleware';
import * as Cookies from 'cookies';
import * as jwt from 'jsonwebtoken';
import { JwtUtils } from 'mol-lib-common';

jest.mock('../../config/app-config', () => {
	const configMock = { isLocal: false, csrfSecret: 'secret', isAutomatedTest: false };
	return {
		getConfig: () => configMock,
	};
});

describe('Test csrf middleware', () => {
	let context;
	beforeEach(() => {
		context = {
			header: {},
			set: jest.fn() as (e: { [key: string]: string | string[] }) => void,
			get: jest.fn() as (field: string) => string,
			cookies: {
				set: jest.fn(),
				get: jest.fn(),
			} as Partial<Cookies>,
			request: {
				method: 'head',
				header: {},
			},
			response: { headers: {} },
		} as Koa.Context;
	});

	it('should generate jose secret', async () => {
		const secret = await JwtUtils.generateSecret();
		expect(secret).toBeDefined();
	});

	it('should encrypt and decrypt JWE', async () => {
		const someKey = await JwtUtils.generateSecret();
		const jwtKey = await JwtUtils.createSymmetricKey(someKey);
		const payload = { a: 1, b: 5 };
		const encrypted = await JwtUtils.encryptJwe(jwtKey, JSON.stringify(payload));

		const result = await JwtUtils.decryptJwe(jwtKey, encrypted);
		const decrypted = JSON.parse(result.payload.toString('utf8'));
		expect(decrypted).toEqual(payload);
	});

	it('Should create token and invalid current context', async () => {
		const nextMiddleware: Koa.Next = jest.fn(() => Promise.resolve());
		const handler = new CreateCsrfMiddleware();
		const middleware = handler.build();
		await middleware(context, nextMiddleware);
		expect(context.cookies.set).toHaveBeenCalled();
	});

	it('Should valid current context', async () => {
		context.request.method = 'post';
		const jwtCookie = jwt.sign({ type: 'cookie', uuid: '1' }, 'secret', { expiresIn: 60 });
		const jwtHeader = jwt.sign({ type: 'header', uuid: '1' }, 'secret', { expiresIn: 60 });

		(context.cookies.get as jest.Mock).mockReturnValue(jwtCookie);
		(context.get as jest.Mock).mockReturnValue(jwtHeader);
		const nextMiddleware: Koa.Next = jest.fn().mockReturnValue(() => Promise.resolve(() => {}));
		const handler = new VerifyCsrfMiddleware();
		const middleware = handler.build();
		await middleware(context, nextMiddleware);
		expect(nextMiddleware as jest.Mock).toBeCalledTimes(1);
	});

	it('Should not valid current context', async () => {
		context.request.method = 'post';
		const jwtCookie = jwt.sign({ type: 'cookie', uuid: '111' }, 'secret', { expiresIn: 60 });
		const jwtHeader = jwt.sign({ type: 'header', uuid: '1' }, 'secret', { expiresIn: 60 });

		(context.cookies.get as jest.Mock).mockReturnValue(jwtCookie);
		(context.get as jest.Mock).mockReturnValue(jwtHeader);
		const nextMiddleware: Koa.Next = jest.fn().mockReturnValue(() => Promise.resolve(() => {}));
		const handler = new VerifyCsrfMiddleware();
		const middleware = handler.build();
		let test;
		try {
			test = async () => await middleware(context, nextMiddleware);
		} catch (e) {
			expect(test).rejects.toContain('Invalid csrf');
			expect(nextMiddleware as jest.Mock).toBeCalledTimes(0);
		}
	});
});
