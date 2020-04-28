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

export async function startServer(): Promise<Server> {
	// Setup service
	LoggerV2.setServiceName(config.name);

	// Setup server
	const router: KoaRouter = new KoaRouter();
	// @ts-ignore
	const HandledRoutes = new KoaResponseHandler(router.routes());

	const koaServer = new Koa()
		.use(compress({
			filter: () => true,
			threshold: 2048,
			flush: require("zlib").Z_SYNC_FLUSH,
			level: require("zlib").Z_BEST_COMPRESSION,
		}))
		.use(body({
			multipart: true,
			jsonLimit: "10mb",
			formLimit: "10mb",
			textLimit: "10mb",
		}))
		.use(new KoaErrorHandler().build())
		.use(new KoaLoggerContext().build())
		.use(new KoaMultipartCleaner().build())
		.use(HealthCheckMiddleware.build())
		.use(HandledRoutes.build())
		.use(router.allowedMethods());

	return new Promise((resolve) => {
		const server = koaServer.listen(config.port, async () => {
			logger.info(`${config.name} v${config.version} started on port ${config.port}`);
			resolve(server);
		});
	});
}
