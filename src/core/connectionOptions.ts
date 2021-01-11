import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { getConfig } from '../config/app-config';
import { LoggerOptions } from 'typeorm/logger/LoggerOptions';

export function getConnectionOptions(setLocalHostForMigrations: boolean): PostgresConnectionOptions {
	const config = getConfig();
	const LOCALHOST = '127.0.0.1';

	const logging: LoggerOptions = ['schema', 'migration', 'error'];
	if (config.logQueries) {
		logging.push('query');
	}

	return {
		database: config.database.instance,
		entities: [__dirname + '/../models/entities/*.ts'],
		logging,
		host: setLocalHostForMigrations ? LOCALHOST : config.database.host,
		port: +config.database.port,
		username: config.database.username,
		password: config.database.password,
		synchronize: false,
		type: 'postgres',
		migrations: ['migrations/**/*{.js,.ts}'],
		cli: { migrationsDir: 'migrations', entitiesDir: 'src/models/entities' },
	} as PostgresConnectionOptions;
}
