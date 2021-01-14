import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { getConfig } from '../config/app-config';
import { LoggerOptions } from 'typeorm/logger/LoggerOptions';
import * as Migrations from '../migrations';
import * as Models from '../models';
import { map } from 'lodash';
export function getConnectionOptions(): PostgresConnectionOptions {
	const config = getConfig();
	const LOCALHOST = '127.0.0.1';

	const logging: LoggerOptions = ['schema', 'migration', 'error'];
	if (config.logQueries) {
		logging.push('query');
	}

	return {
		database: config.database.instance,
		entities: map(Models),
		logging,
		host: process.env['LOCALHOST'] === 'true' ? LOCALHOST : config.database.host,
		port: +config.database.port,
		username: config.database.username,
		password: config.database.password,
		synchronize: false,
		type: 'postgres',
		migrations: map(Migrations),
		migrationsRun: true,
		cli: { migrationsDir: 'src/migrations' },
	} as PostgresConnectionOptions;
}
