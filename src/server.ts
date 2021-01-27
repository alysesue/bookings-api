import { Server } from 'http';
import * as Koa from 'koa';
import * as noCache from 'koa-no-cache';
import * as body from 'koa-body';
import * as compress from 'koa-compress';
import * as KoaRouter from 'koa-router';
import { logger, LoggerV2 } from 'mol-lib-common';
import { KoaErrorHandler } from 'mol-lib-common';
import { KoaLoggerContext } from 'mol-lib-common';
import { KoaMultipartCleaner } from 'mol-lib-common';
import { KoaResponseHandler } from 'mol-lib-common';
import 'reflect-metadata';
import { basePath, getConfig } from './config/app-config';
import { HealthCheckMiddleware } from './health/HealthCheckMiddleware';
import { RegisterRoutes } from './routes';
import { Container, Scope } from 'typescript-ioc';
import * as cors from '@koa/cors';
import { useSwagger } from './infrastructure/swagger.middleware';
import { ContainerContextMiddleware } from './infrastructure/containerContext.middleware';
import { UserContextMiddleware } from './infrastructure/userContext.middleware';
import { ApiData } from './apicontract';
import { BusinessErrorMiddleware } from './infrastructure/businessError.middleware';
import { getConnectionOptions } from './core/connectionOptions';
import { CitizenUserValidationMiddleware } from './infrastructure/citizenUserValidation.middleware';
import { KoaContextStoreMiddleware } from './infrastructure/koaContextStore.middleware';
import { MolUsersService, MolUsersServiceFactory } from './components/users/molUsers/molUsers.service';
import { AutomatedTestMiddleware } from './infrastructure/automatedTest.middleware';
import { DbConnection } from './core/db.connection';

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

function bypassMiddleware(regexp: RegExp, target: Koa.Middleware): Koa.Middleware {
	async function bypass(this: any, ctx, next) {
		if (regexp.test(ctx.path)) {
			await next();
		} else {
			await target.call(this, ctx, next);
		}
	}

	return bypass;
}

function setIOCBindings() {
	Container.bind(MolUsersService)
		.factory((buildContext) => buildContext.resolve(MolUsersServiceFactory).getService())
		.scope(Scope.Request);
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
	// tslint:disable-next-line: tsr-detect-non-literal-regexp
	const byPassAuthPath = new RegExp(`^${basePath}/api/v1/usersessions/anonymous$`);
	setIOCBindings();
	let koaServer = new Koa()
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
		.use(cors({ credentials: config.isLocal }))
		.use(noCache({ global: true }))
		.use(new KoaErrorHandler().build())
		.use(await useSwagger())
		.use(new BusinessErrorMiddleware().build())
		.use(new KoaLoggerContext().build())
		.use(new KoaMultipartCleaner().build())
		.use(HealthCheckMiddleware.build())
		.use(router.allowedMethods());

	if (config.isAutomatedTest) {
		koaServer = koaServer.use(new AutomatedTestMiddleware().build());
	}

	koaServer = koaServer
		.use(new ContainerContextMiddleware().build())
		.use(new KoaContextStoreMiddleware().build())
		.use(bypassMiddleware(byPassAuthPath, new UserContextMiddleware().build()))
		.use(bypassMiddleware(byPassAuthPath, new CitizenUserValidationMiddleware().build()))
		.use(HandledRoutes.build());

	const dbOptions = getConnectionOptions();
	logger.info(`Using DB: ${dbOptions.database} at ${dbOptions.host}`);
	const dbConnection = Container.get(DbConnection);
	await dbConnection.synchronize();
	await dbConnection.runMigrations();
	return await new Promise(async (resolve) => {
		const server = koaServer.listen(config.port, async () => {
			logger.info(`${config.name} v${config.version} started on port ${config.port}`);
			resolve(server);
		});
	});
}
