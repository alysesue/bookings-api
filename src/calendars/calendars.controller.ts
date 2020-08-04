import { Inject } from "typescript-ioc";
import { CalendarUserModel } from "./calendars.apicontract";
import { CalendarsService } from "./calendars.service";
import { Body, Controller, Path, Post, Route, SuccessResponse, Tags } from "tsoa";

@Route("v1/calendars")
@Tags('Calendars')
export class CalendarsController extends Controller {
	@Inject
	private calendarsService: CalendarsService;

	/**
	 * Adds read or write permission to a Google account for a Calendar.
	 * @param calendarUUID The calendar UUID
	 * @param model
	 */
	@Post("{calendarUUID}/useraccess")
	public async addUser(@Path() calendarUUID: string, @Body() model: CalendarUserModel): Promise<CalendarUserModel> {
		return await this.calendarsService.addUser(calendarUUID, model);
	}
}
