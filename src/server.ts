import { Server } from "http";
import * as Koa from "koa";
import * as body from "koa-body";
import * as compress from "koa-compress";
import * as KoaRouter from "koa-router";
import { logger, LoggerV2 } from "mol-lib-common/debugging/logging/LoggerV2";
import { KoaErrorHandler } from "mol-lib-common/network/router/KoaErrorHandler";
import { KoaLoggerContext } from "mol-lib-common/network/router/KoaLoggerContext";
import { KoaMultipartCleaner } from "mol-lib-common/network/router/KoaMultipartCleaner";
import { KoaResponseHandler } from "mol-lib-common/network/router/KoaResponseHandler";
import "reflect-metadata";
import { config } from "./config/app-config";
import { HealthCheckMiddleware } from "./health/HealthCheckMiddleware";
import { RegisterRoutes } from "./routes";
import * as swagger from "swagger2";
import { ui } from 'swagger2-koa';
import { DbConnection } from "./core/db.connection";
import { Container } from "typescript-ioc";
import { CalDavProxyHandler } from "./infrastructure/caldavproxy.handler";
import * as cors from '@koa/cors';
import * as fs from 'fs';
import { join } from 'path';

const setService = async (ctx, next) => {
	Container.bindName('config').to({
		service: ctx.params.service || 'default'
	});
	await next();
};

const useSwagger = () => {
	const swaggerDoc = join(__dirname, 'swagger/swagger.yaml');
	// tslint:disable-next-line: tsr-detect-non-literal-fs-filename
	const exists = fs.existsSync(swaggerDoc);

	logger.info(`Swagger document location: ${swaggerDoc} ${exists ? '(found)' : '(not found)'}`);
	if (exists) {
		const document = swagger.loadDocumentSync(swaggerDoc);
		return ui(document as swagger.Document, "/swagger");
	}

	async function emptyMiddleware(_ctx, next) {
		await next();
	}

	return emptyMiddleware;
};

export async function startServer(): Promise<Server> {
	// Setup service
	LoggerV2.setServiceName(config.name);

	// Setup server
	const router: KoaRouter = new KoaRouter();
	RegisterRoutes(router);
	const serviceAwareRouter = new KoaRouter({ prefix: '/api' })
		.use('/:service/**', setService)
		.use(router.routes(), router.allowedMethods());
	// @ts-ignore
	const HandledRoutes = new KoaResponseHandler(serviceAwareRouter.routes());
	const proxyHandler = Container.get(CalDavProxyHandler);


	const koaServer = new Koa()
		.use(proxyHandler.build())
		.use(
			compress({
				filter: () => true,
				threshold: 2048,
				flush: require("zlib").Z_SYNC_FLUSH,
				level: require("zlib").Z_BEST_COMPRESSION,
			})
		)
		.use(
			body({
				multipart: true,
				jsonLimit: "10mb",
				formLimit: "10mb",
				textLimit: "10mb",
			})
		)
		.use(cors())
		.use(useSwagger())
		.use(new KoaErrorHandler().build())
		.use(new KoaLoggerContext().build())
		.use(new KoaMultipartCleaner().build())
		.use(HealthCheckMiddleware.build())
		.use(HandledRoutes.build())
		.use(serviceAwareRouter.allowedMethods());

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
