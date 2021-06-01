import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';

export const verifyUrl = (urlString?: string): URL => {
	let url;
	try {
		url = new URL(urlString);
	} catch (e) {
		throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Invalid URL');
	}
	return url;
};
