/**
 * @deprecated The class should not be used, it has been created at the start of the project to link booking with google calendar (with caldav protocole). We dont use it anymore
 */
import { Inject } from 'typescript-ioc';
import { Body, Controller, Path, Post, Response, Route, Tags } from 'tsoa';
import { MOLAuth } from 'mol-lib-common';
import { ApiData, ApiDataFactory } from '../../apicontract';
import { CalendarUserModel } from './calendars.apicontract';
import { CalendarsService } from './calendars.service';

@Route('v1/calendars')
@Tags('Calendars')
export class CalendarsController extends Controller {
	@Inject
	private calendarsService: CalendarsService;

	/**
	 * Adds read or write permission to a Google account for a Calendar.
	 *
	 * @param calendarUUID The calendar UUID
	 * @param model
	 */
	@Post('{calendarUUID}/useraccess')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async addUser(
		@Path() calendarUUID: string,
		@Body() model: CalendarUserModel,
	): Promise<ApiData<CalendarUserModel>> {
		return ApiDataFactory.create(await this.calendarsService.addUser(calendarUUID, model));
	}
}
