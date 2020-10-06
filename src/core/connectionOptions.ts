import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import {
	AdminUser,
	AgencyUser,
	Booking,
	BookingChangeLog,
	Calendar,
	Organisation,
	OrganisationAdminGroupMap,
	ScheduleForm,
	Service,
	ServiceAdminGroupMap,
	ServiceProvider,
	ServiceProviderGroupMap,
	SingPassUser,
	TimeslotItem,
	TimeslotsSchedule,
	Unavailability,
	User,
	WeekDayBreak,
	WeekDaySchedule,
} from '../models';
import { getConfig } from '../config/app-config';
import { LoggerOptions } from 'typeorm/logger/LoggerOptions';

export function getConnectionOptions(): PostgresConnectionOptions {
	const config = getConfig();
	const logging: LoggerOptions = ['schema', 'migration', 'error'];
	if (config.isDev) {
		logging.push('query');
	}
	return {
		database: config.database.instance,
		entities: [
			AdminUser,
			AgencyUser,
			Booking,
			BookingChangeLog,
			Calendar,
			Organisation,
			OrganisationAdminGroupMap,
			ScheduleForm,
			Service,
			ServiceAdminGroupMap,
			ServiceProvider,
			ServiceProviderGroupMap,
			SingPassUser,
			TimeslotItem,
			TimeslotsSchedule,
			Unavailability,
			User,
			WeekDayBreak,
			WeekDaySchedule,
		],
		logging,
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
