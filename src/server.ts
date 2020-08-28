import { Server } from "http";
import * as Koa from "koa";
import { Context } from "koa";
import * as body from "koa-body";
import * as compress from "koa-compress";
import * as KoaRouter from "koa-router";
import { logger, LoggerV2 } from "mol-lib-common/debugging/logging/LoggerV2";
import { KoaErrorHandler } from "mol-lib-common/network/router/KoaErrorHandler";
import { KoaLoggerContext } from "mol-lib-common/network/router/KoaLoggerContext";
import { KoaMultipartCleaner } from "mol-lib-common/network/router/KoaMultipartCleaner";
import { KoaResponseHandler } from "mol-lib-common/network/router/KoaResponseHandler";
import "reflect-metadata";
import { basePath, getConfig } from "./config/app-config";
import { HealthCheckMiddleware } from "./health/HealthCheckMiddleware";
import { RegisterRoutes } from "./routes";
import { DbConnection } from "./core/db.connection";
import { Container, Scope } from "typescript-ioc";
import { CalDavProxyHandler } from "./infrastructure/caldavproxy.handler";
import * as cors from '@koa/cors';
import { useSwagger } from "./infrastructure/swagger.middleware";
import { ContainerContextMiddleware } from "./infrastructure/containerContext.middleware";
import { UserContextMiddleware } from "./infrastructure/userContext.middleware";

export async function startServer(): Promise<Server> {
	const config = getConfig();
	// Setup service
	LoggerV2.setServiceName(config.name);

	// Setup server
	const router: KoaRouter = new KoaRouter({ prefix: `${basePath}/api` });
	RegisterRoutes(router);
	// @ts-ignore
	const HandledRoutes = new KoaResponseHandler(router.routes());
	const proxyHandler = Container.get(CalDavProxyHandler);

	const koaServer = new Koa()
		.use(proxyHandler.build())
		.use(
			compress({
				filter: () => true,
				threshold: 2048,
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
		.use(cors({ credentials: config.isDev }))
		.use(await useSwagger())
		.use(new KoaErrorHandler().build())
		.use(new KoaLoggerContext().build())
		.use(new KoaMultipartCleaner().build())
		.use(HealthCheckMiddleware.build())
		.use(new ContainerContextMiddleware().build())
		.use(new UserContextMiddleware().build())
		.use(HandledRoutes.build())
		.use(router.allowedMethods());

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
