import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";
import { Booking, Calendar, ServiceProvider, TemplateTimeslots } from "../models";

export const connectionOptions: PostgresConnectionOptions = {
	database: process.env.DB_DATABASE,
	entities: [
		Booking, Calendar, TemplateTimeslots, ServiceProvider
	],
	host: process.env.DB_HOST,
	logging: ["schema", "migration"],
	password: process.env.DB_PASSWORD,
	port: +process.env.DB_PORT,
	synchronize: false,
	type: 'postgres',
	username: process.env.DB_USERNAME
};
