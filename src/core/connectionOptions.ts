import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";
import { Booking, Calendar, Schedule, Service, ServiceProvider, WeekDaySchedule } from "../models";

export const connectionOptions: PostgresConnectionOptions = {
	database: process.env.DB_DATABASE,
	entities: [
		Booking, Calendar, WeekDaySchedule, Schedule, Service, ServiceProvider
	],
	host: process.env.DB_HOST,
	logging: ["schema", "migration"],
	password: process.env.DB_PASSWORD,
	port: +process.env.DB_PORT,
	synchronize: false,
	type: 'postgres',
	username: process.env.DB_USERNAME
};
