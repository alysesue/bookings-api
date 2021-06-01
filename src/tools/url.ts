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

export const verifyUrlLength = (urlString: string): boolean => {
	if (urlString.length <= 2000) {
		return true;
	}
	throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('Invalid URL length');
};

export const verifyUrlAndLength = (urlString?: string): boolean => {
	if (!urlString) {
		return false;
	}
	verifyUrl(urlString);
	verifyUrlLength(urlString);
	return true;
};
