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
		await this.pool.query('DELETE FROM service_admin_group_map');
		await this.pool.query('DELETE FROM unavailability;');
		await this.pool.query('DELETE FROM booking_change_log;');
		await this.pool.query('DELETE FROM booking;');
		await this.pool.query('DELETE FROM timeslot_item;');
		await this.pool.query('DELETE FROM week_day_break;');
		await this.pool.query('DELETE FROM week_day_schedule;');
		await this.pool.query('DELETE FROM service_provider_group_map;');
		await this.pool.query('DELETE FROM service_provider;');
		await this.pool.query('DELETE FROM service;');
		await this.pool.query('DELETE FROM admin_user;');
		await this.pool.query('DELETE FROM timeslots_schedule;');
		await this.pool.query('DELETE FROM schedule_form;');
	}

	public async mapServiceAdminToService({serviceId, nameService, organisation }) {
		await this.pool.query(`INSERT INTO public.service_admin_group_map("_serviceId", "_serviceOrganisationRef") values(${serviceId}, '${nameService}:${organisation}')`);
	}

	public async mapServiceProviderToAdminId({serviceProviderId, molAdminId}) {
		await this.pool.query(`INSERT INTO public.service_provider_group_map("_serviceProviderId","_molAdminId") values (${serviceProviderId}, '${molAdminId}')`)
	}

	public async close() {
		await this.pool.end();
	}
}
