import { Server } from 'http';
import * as Koa from 'koa';
import * as noCache from 'koa-no-cache';
import * as body from 'koa-body';
import * as compress from 'koa-compress';
import * as KoaRouter from 'koa-router';
import { logger, LoggerV2 } from 'mol-lib-common/debugging/logging/LoggerV2';
import { KoaErrorHandler } from 'mol-lib-common/network/router/KoaErrorHandler';
import { KoaLoggerContext } from 'mol-lib-common/network/router/KoaLoggerContext';
import { KoaMultipartCleaner } from 'mol-lib-common/network/router/KoaMultipartCleaner';
import { KoaResponseHandler } from 'mol-lib-common/network/router/KoaResponseHandler';
import 'reflect-metadata';
import { basePath, getConfig } from './config/app-config';
import { HealthCheckMiddleware } from './health/HealthCheckMiddleware';
import { RegisterRoutes } from './routes';
import { DbConnection } from './core/db.connection';
import { Container } from 'typescript-ioc';
import * as cors from '@koa/cors';
import { useSwagger } from './infrastructure/swagger.middleware';
import { ContainerContextMiddleware } from './infrastructure/containerContext.middleware';
import { UserContextMiddleware } from './infrastructure/userContext.middleware';
import { ApiData } from './apicontract';
import { BusinessErrorMiddleware } from './infrastructure/businessError.middleware';

class ApiDataResponseHandler {
	private _middleware: Koa.Middleware;
	constructor(middleware: Koa.Middleware) {
		this._middleware = middleware;
	}

	public build(): Koa.Middleware {
		const emptyNext: Koa.Next = () => Promise.resolve();
		const emptyMiddleware: Koa.Middleware = () => {};
		const koaResponseMiddleware = new KoaResponseHandler(emptyMiddleware).build();

		return async (ctx: Koa.Context, next: Koa.Next): Promise<any> => {
			await this._middleware(ctx, next);

			if (!(ctx.body instanceof ApiData)) {
				await koaResponseMiddleware(ctx, emptyNext);
			}
		};
	}
}

export async function startServer(): Promise<Server> {
	const config = getConfig();
	// Setup service
	LoggerV2.setServiceName(config.name);

	// Setup server
	const router: KoaRouter = new KoaRouter({ prefix: `${basePath}/api` });
	RegisterRoutes(router);
	// @ts-ignore
	const HandledRoutes = new ApiDataResponseHandler(router.routes());
	const koaServer = new Koa()
		.use(
			compress({
				filter: () => true,
				threshold: 2048,
			}),
		)
		.use(
			body({
				multipart: true,
				jsonLimit: '10mb',
				formLimit: '10mb',
				textLimit: '10mb',
			}),
		)
		.use(cors({ credentials: config.isDev }))
		.use(noCache({ global: true }))
		.use(await useSwagger())
		.use(new KoaErrorHandler().build())
		.use(new BusinessErrorMiddleware().build())
		.use(new KoaLoggerContext().build())
		.use(new KoaMultipartCleaner().build())
		.use(HealthCheckMiddleware.build())
		.use(router.allowedMethods())
		.use(new ContainerContextMiddleware().build())
		.use(new UserContextMiddleware().build())
		.use(HandledRoutes.build());

	const dbConnection = Container.get(DbConnection);

	await dbConnection.runMigrations();
	await dbConnection.synchronize();

	return await new Promise(async (resolve) => {
		const server = koaServer.listen(config.port, async () => {
			logger.info(`${config.name} v${config.version} started on port ${config.port}`);
			resolve(server);
		});
	});
}
