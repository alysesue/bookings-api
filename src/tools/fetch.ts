import axios, { AxiosResponse } from 'axios';

export const post = async <T = any>(path: string, data?: any, header?: any) => {
	const headers = { 'Content-Type': 'application/json', ...header };
	const res = await axios.request<any, AxiosResponse<T>>({
		method: 'post',
		url: path,
		data,
		headers,
	});
	return res.data;
};

export const get = async <T = any>(path: string, data?: any, header?: any) => {
	const headers = { 'Content-Type': 'application/json', ...header };
	const res = await axios.request<any, AxiosResponse<T>>({
		method: 'get',
		url: path,
		data,
		headers,
	});
	return res.data;
};
