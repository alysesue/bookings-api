import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { LoggerOptions } from 'typeorm/logger/LoggerOptions';
import { map } from 'lodash';
import { getConfig } from '../config/app-config';
import * as Migrations from '../migrations';
import * as Entities from '../models/entities';
export function getConnectionOptions(): PostgresConnectionOptions {
	const config = getConfig();
	const LOCALHOST = '127.0.0.1';

	const logging: LoggerOptions = ['schema', 'migration', 'error'];
	if (config.logQueries) {
		logging.push('query');
	}

	return {
		database: config.database.instance,
		entities: map(Entities),
		logging,
		host: process.env['LOCALHOST'] === 'true' ? LOCALHOST : config.database.host,
		port: +config.database.port,
		username: config.database.username,
		password: config.database.password,
		synchronize: false,
		type: 'postgres',
		migrations: map(Migrations),
		migrationsRun: false,
		cli: { migrationsDir: 'src/migrations' },
	} as PostgresConnectionOptions;
}
