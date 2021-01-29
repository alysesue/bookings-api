import * as parse from 'csv-parse/lib/sync';
import { logger } from 'mol-lib-common';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';

export const parseCsv = <T extends {}>(input: string | Buffer): T[] => {
	try {
		return parse(input, {
			columns: true,
			skip_empty_lines: true,
			trim: true,
		});
	} catch (e) {
		logger.error(e);
		throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(`Invalid csv format`);
	}
};

export const stringToArrayOfStringWhenSemicolon = (field?: string): string[] => {
	return field?.split(';').map((value) => value.trim());
};
