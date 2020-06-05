import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";
import { Booking, Calendar, Schedule, Service, ServiceProvider, WeekDayBreak, WeekDaySchedule } from "../models";
import { config } from '../config/app-config';

export const connectionOptions: PostgresConnectionOptions = {
	database: config.database.instance,
	entities: [
		Booking, Calendar, Service, Schedule, ServiceProvider, WeekDayBreak, WeekDaySchedule
	],
	logging: ["schema", "migration"],
	host: config.database.host,
	port: +config.database.port,
	username: config.database.username,
	password: config.database.password,
	synchronize: false,
	type: 'postgres'
};
