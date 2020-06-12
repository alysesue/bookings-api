import { Inject } from "typescript-ioc";
import { CalendarUserModel } from "./calendars.apicontract";
import { CalendarsService } from "./calendars.service";
import { Body, Controller, Header, Path, Post, Route, Security, Tags } from "tsoa";

@Route("v1/calendars")
@Tags('Calendars')
export class CalendarsController extends Controller {
	@Inject
	private calendarsService: CalendarsService;

	@Post("{calendarUUID}/useraccess")
	public async addUser(@Path() calendarUUID: string, @Body() model: CalendarUserModel): Promise<CalendarUserModel> {
		return await this.calendarsService.addUser(calendarUUID, model);
	}
}
