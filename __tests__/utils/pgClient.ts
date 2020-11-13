import { Pool } from 'pg';

export class PgClient {
	private pool;
	constructor() {
		this.pool = new Pool({
			user: process.env['BOOKINGSG_DB_USERNAME'],
			host: 'localhost',
			database: process.env['BOOKINGSG_DB_INSTANCE'],
			password: process.env['DB_PASSWORD_BOOKINGSG_APP'],
			port: process.env['BOOKINGSG_DB_PORT'],
		});
	}
	public async cleanAllTables() {
		// Delete many-to-one relationships first
		await this.pool.query('DELETE FROM timeslot_item;');
		await this.pool.query('DELETE FROM timeslots_schedule;');
		await this.pool.query('DELETE FROM week_day_break;');
		await this.pool.query('DELETE FROM week_day_schedule;');
		await this.pool.query('DELETE FROM schedule_form;');
		await this.pool.query('DELETE FROM service_provider_group_map;');
		await this.pool.query('DELETE FROM service_provider;');
		await this.pool.query('DELETE FROM service;');
		await this.pool.query('DELETE FROM admin_user;');
	}

	public async close() {
		await this.pool.end();
	}
}
