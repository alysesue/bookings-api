import { logger } from "mol-lib-common/debugging/logging/LoggerV2";


import * as parse from 'csv-parse/lib/sync'
const assert = require('assert')

import { ServiceProviderModel } from "../serviceProviders/serviceProviders.apicontract";

export const parseCsv = (input: string | Buffer): [] => {
	return parse(input, {
		columns: true,
		skip_empty_lines: true
	});
};

export const parseServiceProvidersCsv = (input: string | Buffer): ServiceProviderModel[] => {
	try {
		const res = parseCsv(input)
		return res as ServiceProviderModel[];
	} catch (e) {
		logger.error(e);
		throw new Error('Invalid csv format');
	}
}



