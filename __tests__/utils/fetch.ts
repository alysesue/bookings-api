import * as fs from 'fs';
import axios, { AxiosResponse } from 'axios';
import { post, put } from '../../src/tools/fetch';

export const BOOKINSG_API_ENDPOINT = 'http://www.local.booking.gov.sg:3999/bookingsg/api/v1';
const apiCall = (callback) => async (...params) => {
	try {
		await callback(...params);
	} catch (e) {
		// tslint:disable-next-line:no-console
		console.error('Error: ', e.response);
	}
};

export const AxiosPostCSV = async <T = any>(path: string, pathfile?: any, header?: any) => {
	const headers = { 'Content-Type': 'text/plain', ...header };
	// tslint:disable-next-line:tsr-detect-non-literal-fs-filename
	const data = fs.readFileSync(pathfile, 'utf-8');
	const res = await axios.request<any, AxiosResponse<T>>({
		method: 'post',
		url: BOOKINSG_API_ENDPOINT + path,
		data,
		headers,
	});
	return res.data;
};

export const fetch = () => ({ postCSV: apiCall(AxiosPostCSV), post: apiCall(post), put: apiCall(put)});
