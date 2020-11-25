import axios, { AxiosResponse } from 'axios';

export const axiosInstance = axios.create();


export const post = async <T = any>(path: string, data?: any, header?: any) => {
	const headers = { 'Content-Type': 'application/x-www-form-urlencoded', ...header };
	const res = await axiosInstance.request<any, AxiosResponse<T>>({
		method: 'post',
		url: path,
		data,
		headers,
	});
	return res.data;
};
