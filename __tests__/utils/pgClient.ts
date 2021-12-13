import { QueryResult } from 'pg';
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
		await this.pool.query('DELETE FROM public.otp_user;');
		await this.pool.query('DELETE FROM public.otp;');
		await this.pool.query('DELETE FROM public.serviceprovider_label');
		await this.pool.query('DELETE FROM public.service_provider_label');
		await this.pool.query('DELETE FROM public.service_provider_label_category');
		await this.pool.query('DELETE FROM public.service_notification_template;');
		await this.pool.query('DELETE FROM public.dynamic_field');
		await this.pool.query('DELETE FROM public.label');
		await this.pool.query('DELETE FROM public.one_off_timeslot;');
		await this.pool.query('DELETE FROM public.booked_slot');
		await this.pool.query('DELETE FROM public.setting;');
		await this.pool.query('DELETE FROM public.label_category;');
		await this.pool.query('DELETE FROM public.service_admin_group_map');
		await this.pool.query('DELETE FROM public.unavailable_service_provider;');
		await this.pool.query('DELETE FROM public.unavailability;');
		await this.pool.query('DELETE FROM public.booking_workflow;');
		await this.pool.query('DELETE FROM public.booking_change_log;');
		await this.pool.query('DELETE FROM public.booking;');
		await this.pool.query('DELETE FROM public.event_label');
		await this.pool.query('DELETE FROM public.event');
		await this.pool.query('DELETE FROM public.timeslot_item;');
		await this.pool.query('DELETE FROM public.week_day_break;');
		await this.pool.query('DELETE FROM public.week_day_schedule;');
		await this.pool.query('DELETE FROM public.service_provider_group_map;');
		await this.pool.query('DELETE FROM public.service_provider;');
		await this.pool.query('DELETE FROM public.admin_user;');
		await this.pool.query('DELETE FROM public.service;');
		await this.pool.query('DELETE FROM public.sing_pass_user;');
		await this.pool.query('DELETE FROM public.agency_user;');
		await this.pool.query('DELETE FROM public.anonymous_user;');
		await this.pool.query('DELETE FROM public.user;');
		await this.pool.query('DELETE FROM public.timeslots_schedule;');
		await this.pool.query('DELETE FROM public.schedule_form;');
		await this.pool.query('DELETE FROM public.organisation_admin_group_map;');
		await this.pool.query('DELETE FROM public.organisation;');
	}

	public async mapDynamicFields({ type, serviceId, name, options }): Promise<QueryResult<any>> {
		return await this.pool.query({
			text: `INSERT INTO public.dynamic_field("_type", "_serviceId", "_name", "_options") values($1, $2, $3, $4) RETURNING _id`,
			values: [type, serviceId, name, options],
		});
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

	public async setOrganisation({ organisationName, schemaVersion = { schemaVersion: 2 } }): Promise<void> {
		await this.pool.query({
			text: `INSERT INTO public.organisation("_name", "_configuration") values ($1, $2)`,
			values: [organisationName, schemaVersion],
		});
	}

	public async mapOrganisation({ organisationId, organisationName }): Promise<void> {
		await this.pool.query({
			text: `INSERT INTO public.organisation_admin_group_map("_organisationId", "_organisationRef") values ($1, $2)`,
			values: [organisationId, organisationName],
		});
	}

	public async getFirstOrganisationId(): Promise<number> {
		const res = await this.pool.query({
			text: `SELECT * FROM public.organisation`,
		});
		return res.rows[0]._id;
	}

	public async configureServiceAllowAnonymous({ serviceId }): Promise<void> {
		await this.pool.query({
			text: `UPDATE public.service set "_citizenAuthentication" = '{otp}' where _id = $1`,
			values: [serviceId],
		});
	}

	public async setServiceConfigurationOnHold(serviceId: number, onHold: boolean): Promise<void> {
		await this.pool.query({
			text: `UPDATE public.service set "_isOnHold" = $1 where _id = $2`,
			values: [onHold, serviceId],
		});
	}

	public async setServiceConfigurationStandAlone(serviceId, standAlone): Promise<void> {
		await this.pool.query({
			text: `UPDATE public.service set "_isStandAlone" = $1 where _id = $2`,
			values: [standAlone, serviceId],
		});
	}

	public async setServiceHasSalutation(serviceId, hasSalutation): Promise<void> {
		await this.pool.query({
			text: `UPDATE public.service set "_hasSalutation" = $1 where _id = $2`,
			values: [hasSalutation, serviceId],
		});
	}

	public async setServiceProviderAutoAccept({ serviceProviderId, autoAcceptBookings }): Promise<void> {
		await this.pool.query({
			text: `UPDATE public.service_provider set "_autoAcceptBookings" = $1 where _id = $2`,
			values: [autoAcceptBookings, serviceProviderId],
		});
	}

	public async setServiceConfigurationRequireVerifyBySA(
		serviceId: number,
		requireVerifyBySA: boolean,
	): Promise<void> {
		await this.pool.query({
			text: `UPDATE public.service set "_requireVerifyBySA" = $1 where _id = $2`,
			values: [requireVerifyBySA, serviceId],
		});
	}

	public async close() {
		await this.pool.end();
	}
}
