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
		await this.pool.query('DELETE FROM public.service_admin_group_map');
		await this.pool.query('DELETE FROM public.unavailability;');
		await this.pool.query('DELETE FROM public.booking_change_log;');
		await this.pool.query('DELETE FROM public.booking;');
		await this.pool.query('DELETE FROM public.timeslot_item;');
		await this.pool.query('DELETE FROM public.week_day_break;');
		await this.pool.query('DELETE FROM public.week_day_schedule;');
		await this.pool.query('DELETE FROM public.service_provider_group_map;');
		await this.pool.query('DELETE FROM public.service_provider;');
		await this.pool.query('DELETE FROM public.service;');
		await this.pool.query('DELETE FROM public.admin_user;');
		await this.pool.query('DELETE FROM public.sing_pass_user;');
		await this.pool.query('DELETE FROM public.agency_user;');
		await this.pool.query('DELETE FROM public.user;');
		await this.pool.query('DELETE FROM public.timeslots_schedule;');
		await this.pool.query('DELETE FROM public.schedule_form;');
	}

	public async mapServiceAdminToService({ serviceId, nameService, organisation }) {
		await this.pool.query(
			`INSERT INTO public.service_admin_group_map("_serviceId", "_serviceOrganisationRef") values(${serviceId}, '${nameService}:${organisation}')`,
		);
	}

	public async mapServiceProviderToAdminId({ serviceProviderId, molAdminId }) {
		await this.pool.query(
			`INSERT INTO public.service_provider_group_map("_serviceProviderId","_molAdminId") values (${serviceProviderId}, '${molAdminId}')`,
		);
	}

	public async close() {
		await this.pool.end();
	}
}
