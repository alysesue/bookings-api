import * as swagger from "swagger2";
import { ui } from "swagger2-koa";
import * as fs from 'fs';

export const useSwagger = () => {
	const swaggerDoc = '../../../dist/swagger/swagger.yaml';
	// tslint:disable-next-line: tsr-detect-non-literal-fs-filename
	if (fs.existsSync(swaggerDoc)) {
		const document = swagger.loadDocumentSync(swaggerDoc);
		return ui(document as swagger.Document, "/swagger");
	}

	async function emptyMiddleware(_ctx, next) {
		await next();
	}

	return emptyMiddleware;
};
