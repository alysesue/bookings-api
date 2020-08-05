import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";
import { Booking, Calendar, Schedule, Service, ServiceProvider, TimeslotItem, TimeslotsSchedule, Unavailability, WeekDayBreak, WeekDaySchedule } from "../models";
import { getConfig } from '../config/app-config';

export function getConnectionOptions(): PostgresConnectionOptions {
	const config = getConfig();
	return {
		database: config.database.instance,
		entities: [
			Booking, Calendar, Service, Schedule, ServiceProvider, WeekDayBreak, WeekDaySchedule, TimeslotsSchedule, TimeslotItem, Unavailability
		],
		logging: ["schema", "migration"],
		host: config.database.host,
		port: +config.database.port,
		username: config.database.username,
		password: config.database.password,
		synchronize: false,
		type: 'postgres',
		migrations: ['migrations/**/*{.js,.ts}'],
		cli: { migrationsDir: 'migrations' },
	} as PostgresConnectionOptions;
}
