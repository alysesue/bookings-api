import { Pool } from 'pg';

export class PgClient {
	private pool: Pool;
	constructor() {
		this.pool = new Pool({
			user: process.env['BOOKINGSG_DB_USERNAME'],
			host: 'localhost',
			database: process.env['BOOKINGSG_DB_INSTANCE'],
			password: process.env['DB_PASSWORD_BOOKINGSG_APP'],
			port: +process.env['BOOKINGSG_DB_PORT'],
		});
	}
	public async cleanAllTables() {
		// Delete many-to-one relationships first
		await this.pool.query('DELETE FROM public.service_admin_group_map');
		await this.pool.query('DELETE FROM public.unavailable_service_provider;');
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
		await this.pool.query('DELETE FROM public.anonymous_user;');
		await this.pool.query('DELETE FROM public.user;');
		await this.pool.query('DELETE FROM public.timeslots_schedule;');
		await this.pool.query('DELETE FROM public.schedule_form;');
		await this.pool.query('DELETE FROM public.organisation_admin_group_map;');
		await this.pool.query('DELETE FROM public.organisation;');
	}

	public async mapServiceAdminToService({ serviceId, nameService, organisation }) {
		await this.pool.query({
			text: `INSERT INTO public.service_admin_group_map("_serviceId", "_serviceOrganisationRef") values($1, $2)`,
			values: [serviceId, `${nameService}:${organisation}`],
		});
	}

	public async getAdminIdForServiceProvider({ serviceProviderId }): Promise<string> {
		const res = await this.pool.query({
			text: `SELECT "map"."_molAdminId" from public.service_provider_group_map map where "map"."_serviceProviderId" = $1`,
			values: [serviceProviderId],
		});
		return res.rows[0]._molAdminId;
	}

	public async configureServiceAllowAnonymous({ serviceId }: { serviceId: number }): Promise<void> {
		await this.pool.query({
			text: `UPDATE public.service set "_allowAnonymousBookings" = true where _id = $1`,
			values: [serviceId],
		});
	}

	public async setServiceConfigurationOnHold(serviceId: number, onHold: boolean): Promise<void> {
		await this.pool.query({
			text: `UPDATE public.service set "_isOnHold" = ${onHold} where _id = ${serviceId}`,
		});
	}

	public async setServiceConfigurationStandAlone(serviceId: number, standAlone: boolean): Promise<void> {
		await this.pool.query({
			text: `UPDATE public.service set "_isStandAlone" = ${standAlone} where _id = ${serviceId}`,
		});
	}

	public async setServiceProviderAutoAccept({
		serviceProviderId,
		autoAcceptBookings,
	}: {
		serviceProviderId: number;
		autoAcceptBookings: boolean;
	}): Promise<void> {
		await this.pool.query({
			text: `UPDATE public.service_provider set "_autoAcceptBookings" = $1 where _id = $2`,
			values: [autoAcceptBookings, serviceProviderId],
		});
	}

	public async close() {
		await this.pool.end();
	}
}
