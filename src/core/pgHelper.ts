import { Client } from 'pg';
import { getConfig } from '../config/app-config';

export const createPgClient = (): Client => {
	const config = getConfig();
	const client = new Client({
		host: config.database.host,
		port: +config.database.port,
		database: config.database.instance,
		user: config.database.username,
		password: config.database.password,
	});
	return client;
};
