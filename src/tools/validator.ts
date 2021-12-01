import { getUinfinChecksum } from 'mol-lib-api-contract/utils';

const _ = require('lodash');
export const isSGUinfin = (uinFinString?: string): { pass: boolean; message?: string } => {
	if (!_.isString(uinFinString)) {
		return { pass: false, message: `should be a valid NRIC/FIN` };
	}
	const pattern = '^[XSTFGM]\\d{7}[A-Z]$';
	if (uinFinString.match(pattern) === null) {
		return { pass: false, message: `should be a valid NRIC/FIN` };
	}

	// TO BE REMOVED: cater for X series
	if (uinFinString.charAt(0) === 'X') return { pass: true };

	const checkSum = getUinfinChecksum(uinFinString);
	if (uinFinString.charAt(8) !== checkSum) {
		return { pass: false, message: `should be a valid NRIC/FIN` };
	}

	return { pass: true };
};
