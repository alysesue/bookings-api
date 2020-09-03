import { Inject } from 'typescript-ioc';
import { CalendarUserModel } from './calendars.apicontract';
import { CalendarsService } from './calendars.service';
import { Body, Controller, Path, Post, Response, Route, Tags } from 'tsoa';
import { MOLAuth } from 'mol-lib-common';

@Route('v1/calendars')
@Tags('Calendars')
export class CalendarsController extends Controller {
	@Inject
	private calendarsService: CalendarsService;

	/**
	 * Adds read or write permission to a Google account for a Calendar.
	 * @param calendarUUID The calendar UUID
	 * @param model
	 */
	@Post('{calendarUUID}/useraccess')
	@MOLAuth({ admin: {} })
	@Response(401, 'Valid authentication types: [admin]')
	public async addUser(@Path() calendarUUID: string, @Body() model: CalendarUserModel): Promise<CalendarUserModel> {
		return await this.calendarsService.addUser(calendarUUID, model);
	}
}
