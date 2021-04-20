import * as fs from 'fs';
import { promisify } from 'util';
import { logger } from 'mol-lib-common';
import * as swagger2 from 'swagger2';
import { ui } from 'swagger2-koa';
import { basePath, getConfig } from '../config/app-config';

// tslint:disable-next-line: tsr-detect-non-literal-fs-filename
const fs_exists = promisify(fs.exists);
const swaggerDir = './swagger';
const swaggerDoc = `${swaggerDir}/swagger.yaml`;

export const useSwagger = async () => {
	const exists = await fs_exists(swaggerDoc);
	const config = getConfig();

	logger.info(`Swagger document location: ${swaggerDoc} ${exists ? '(found)' : '(not found)'}`);
	if (exists && config.bookingEnv !== 'production') {
		const document = swagger2.loadDocumentSync(swaggerDoc);
		return ui(document as swagger2.Document, `${basePath}/swagger`);
	}

	async function emptyMiddleware(_ctx, next) {
		await next();
	}

	return emptyMiddleware;
};
