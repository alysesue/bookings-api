import { ConnectionOptions } from "typeorm";

import { Booking, TimeSlot } from "../models/index";

export const connectionOptions: ConnectionOptions = {
  database: process.env.DB_DATABASE,
  entities: [Booking, TimeSlot],
  host: process.env.DB_HOST,
  logging: false,
  password: process.env.DB_PASSWORD,
  port: +process.env.DB_PORT,
  synchronize: true,
  type: "postgres",
  username: process.env.DB_USERNAME,
};
