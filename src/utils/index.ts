import * as parse from 'csv-parse/lib/sync';

import { logger } from "mol-lib-common/debugging/logging/LoggerV2";

export const parseCsv = (input: string | Buffer): [] => {
	try {
		return parse(input, {
			columns: true,
			skip_empty_lines: true,
			trim: true
		});
	} catch (e) {
		logger.error(e);
		throw new Error('Invalid csv format');
	}
};
