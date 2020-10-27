import { Pool } from 'pg';

export class PgClient {
	private pool;
	constructor() {
		this.pool = new Pool({
			user: process.env['BOOKINGSG_DB_USERNAME'],
			host: 'localhost',
			database: process.env['BOOKINGSG_DB_INSTANCE'],
			password: process.env['DB_PASSWORD_BOOKINGSG_API_APP'],
			port: process.env['BOOKINGSG_DB_PORT'],
		});
	}
	public async cleanAllTables() {
		// Delete many-to-one relationships first
		await this.pool.query('DELETE FROM service_provider_group_map;');
		await this.pool.query('DELETE FROM service_provider;');
		await this.pool.query('DELETE FROM service;');
	}

	public async close() {
		await this.pool.end();
	}
}
