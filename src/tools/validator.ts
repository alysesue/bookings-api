const _ = require('lodash');
export const isSGUinfin = (uinFinString?: string): { pass: boolean; message?: string } => {
	if (!_.isString(uinFinString)) {
		return { pass: false, message: `should be a valid NRIC/FIN` };
	}
	const pattern = '^[XSTFG]\\d{7}[A-Z]$';
	if (uinFinString.match(pattern) === null) {
		return { pass: false, message: `should be a valid NRIC/FIN` };
	}

	return { pass: true };
};
