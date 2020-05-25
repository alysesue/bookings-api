import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";
import { Booking } from "../models/booking";
import { Calendar } from "../models/calendar";
import { Schedule, WeekDaySchedule } from "../models/Schedule";

export const connectionOptions: PostgresConnectionOptions = {
	database: process.env.DB_DATABASE,
	entities: [
		Booking, Calendar, WeekDaySchedule, Schedule
	],
	host: process.env.DB_HOST,
	logging: ["schema", "migration"],
	password: process.env.DB_PASSWORD,
	port: +process.env.DB_PORT,
	synchronize: false,
	type: 'postgres',
	username: process.env.DB_USERNAME
};
