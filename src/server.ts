import { Server } from 'http';
import * as Koa from 'koa';
import * as noCache from 'koa-no-cache';
import * as body from 'koa-body';
import * as compress from 'koa-compress';
import * as KoaRouter from 'koa-router';
import * as helmet from 'koa-helmet';
import * as v8 from 'v8';
import { logger, LoggerV2 } from 'mol-lib-common';
import { KoaErrorHandler } from 'mol-lib-common';
import { KoaLoggerContext } from 'mol-lib-common';
import { KoaMultipartCleaner } from 'mol-lib-common';
import { KoaResponseHandler } from 'mol-lib-common';
import 'reflect-metadata';
import { Container, Scope } from 'typescript-ioc';
import * as cors from '@koa/cors';
import { basePath, getConfig } from './config/app-config';
import { HealthCheckMiddleware } from './health/HealthCheckMiddleware';
import { RegisterRoutes } from './routes';
import { useSwagger } from './infrastructure/swagger.middleware';
import { ContainerContextMiddleware } from './infrastructure/containerContext.middleware';
import { UserContextMiddleware } from './infrastructure/userContext.middleware';
import { ApiData, ApiPagedData, ApiPagedDataV2 } from './apicontract';
import { BusinessErrorMiddleware } from './infrastructure/businessError.middleware';
import { getConnectionOptions } from './core/connectionOptions';
import { CitizenUserValidationMiddleware } from './infrastructure/citizenUserValidation.middleware';
import { KoaContextStoreMiddleware, MANUAL_CONTEXT_RESPONSE } from './infrastructure/koaContextStore.middleware';
import { MolUsersService, MolUsersServiceFactory } from './components/users/molUsers/molUsers.service';
import { AutomatedTestMiddleware } from './infrastructure/automatedTest.middleware';
import { DbConnection } from './core/db.connection';
import { CreateCsrfMiddleware, VerifyCsrfMiddleware, XSRF_HEADER_NAME } from './infrastructure/csrf.middleware';
import { mailer } from './config/mailer';
import { registerRequestClock } from './infrastructure/requestClock';
import {
	NotificationSMSService,
	NotificationSMSServiceFactory,
} from './components/notificationSMS/notificationSMS.service';
import { MyInfoService, MyInfoServiceFactory } from './components/myInfo/myInfo.service';

class ApiDataResponseHandler {
	private readonly _middleware: Koa.Middleware;
	constructor(middleware: Koa.Middleware<any, any>) {
		this._middleware = middleware;
	}

	public build(): Koa.Middleware {
		const emptyNext: Koa.Next = () => Promise.resolve();
		const emptyMiddleware: Koa.Middleware = () => {};
		const koaResponseMiddleware = new KoaResponseHandler(emptyMiddleware).build();

		return async (ctx: Koa.Context, next: Koa.Next): Promise<any> => {
			await this._middleware(ctx, next);

			if (
				!ctx[MANUAL_CONTEXT_RESPONSE] &&
				!(ctx.body instanceof ApiData) &&
				!(ctx.body instanceof ApiPagedData) &&
				!(ctx.body instanceof ApiPagedDataV2)
			) {
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

	Container.bind(NotificationSMSService)
		.factory((buildContext) => buildContext.resolve(NotificationSMSServiceFactory).getService())
		.scope(Scope.Request);

	Container.bind(MyInfoService)
		.factory((buildContext) => buildContext.resolve(MyInfoServiceFactory).getService())
		.scope(Scope.Request);

	registerRequestClock();
}

function getOriginFromWhitelist(ctx: Koa.Context, originWhitelist: string[]) {
	const requestOrigin = ctx.headers?.origin;
	if (requestOrigin && (originWhitelist.includes(requestOrigin) || originWhitelist.includes('*'))) {
		return requestOrigin;
	}
	return originWhitelist[0];
}

function getContentPolicyOptions() {
	return {
		directives: {
			defaultSrc: [
				"'self'",
				'blob:',
				'data:',
				"'unsafe-inline'",
				'https://*.googleapis.com',
				'https://fonts.gstatic.com',
			],
		},
	};
}

const byPassCSRFPaths = [
	'/api/v1/bookings/bulk',
	'/api/v2/bookings/lifesg',
	'/api/v1/encryption/encrypt',
	'/api/v1/users/service-admins/upsert',
	'/api/v1/users/service-admins/upsert/csv',
	'/api/v1/users/service-providers/upsert',
	'/api/v1/users/service-providers/upsert/csv',
];

export async function startServer(): Promise<Server> {
	const config = getConfig();
	const originWhitelist = config.accessControlAllowOrigin.split(',');
	// Setup service
	LoggerV2.setServiceName(config.name);

	const memory = v8.getHeapStatistics();
	logger.info(`[Memory] Total available size: ${Math.round(memory.total_available_size / (1024 * 1024))} MB`);

	// Setup server
	const router: KoaRouter = new KoaRouter({ prefix: `${basePath}/api` });
	RegisterRoutes(router);

	const HandledRoutes = new ApiDataResponseHandler(router.routes());
	const CSRFPathsExpression = byPassCSRFPaths.map((p) => `${basePath}${p}`).join('|');
	// tslint:disable-next-line: tsr-detect-non-literal-regexp
	const byPassCSRF = new RegExp(`^(${CSRFPathsExpression})$`);
	// tslint:disable-next-line: tsr-detect-non-literal-regexp
	const byPassAuthPath = new RegExp(
		`^(${basePath}/api/v2/bookings/authType|${basePath}/api/v1/usersessions/anonymous|${basePath}/api/v1/otp/send|${basePath}/api/v1/otp/verify|${basePath}/api/v1/encryption/encrypt)$`,
	);
	setIOCBindings();
	let koaServer = new Koa()
		.use(new ContainerContextMiddleware().build())
		.use(new KoaContextStoreMiddleware().build())
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
		.use(
			cors({
				credentials: config.isLocal,
				exposeHeaders: `Origin, X-Requested-With, X-Request-Id, Content-Type, Accept, ${XSRF_HEADER_NAME}`,
				origin: (ctx) => getOriginFromWhitelist(ctx, originWhitelist),
				allowMethods: 'GET,PATCH,PUT,POST,DELETE,HEAD',
				maxAge: 120,
			}),
		)
		.use(helmet.contentSecurityPolicy(getContentPolicyOptions()))
		.use(helmet.dnsPrefetchControl({ allow: true }))
		.use(helmet.expectCt())
		.use(
			helmet.frameguard({
				action: 'deny',
			}),
		)
		.use(helmet.hidePoweredBy())
		.use(
			helmet.hsts({
				maxAge: 16070400,
				// Must be enabled to be approved
				includeSubDomains: true,
				preload: true,
			}),
		)
		.use(helmet.ieNoOpen())
		.use(helmet.noSniff())
		.use(helmet.permittedCrossDomainPolicies())
		.use(
			helmet.referrerPolicy({
				policy: 'no-referrer',
			}),
		)
		.use(helmet.xssFilter())
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
		.use(bypassMiddleware(byPassAuthPath, new UserContextMiddleware().build()))
		.use(bypassMiddleware(byPassAuthPath, new CitizenUserValidationMiddleware().build()))
		.use(bypassMiddleware(byPassCSRF, new VerifyCsrfMiddleware().build()))
		.use(new CreateCsrfMiddleware().build())
		.use(HandledRoutes.build());

	const dbOptions = getConnectionOptions();
	logger.info(`Using DB: ${dbOptions.database} at ${dbOptions.host}`);
	const dbConnection = Container.get(DbConnection);
	await dbConnection.runMigrations();
	await dbConnection.runPopulate();
	await mailer();

	koaServer.proxy = true;
	return await new Promise((resolve) => {
		const server = koaServer.listen(config.port, () => {
			logger.info(`${config.name} v${config.version} started on port ${config.port}`);
			resolve(server);
		});
	});
}
