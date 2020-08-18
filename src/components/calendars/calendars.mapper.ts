import { Inject, InRequestScope } from "typescript-ioc";
import { CalendarModel } from "./calendars.apicontract";
import { Calendar } from "../../models";
import { CalDavProxyHandler } from "../../infrastructure/caldavproxy.handler";
import { Constants } from "../../models/constants";

@InRequestScope
export class CalendarsMapper {
	@Inject
	private proxyHandler: CalDavProxyHandler;

	public mapDataModel(calendar: Calendar): CalendarModel {
		if (!calendar) {
			return null;
		}

		return {
			uuid: calendar.uuid,
			externalCalendarUrl: calendar.generateExternalUrl(Constants.CalendarTimezone),
			caldavUserUrl: calendar.generateCaldavUserUrl(this.proxyHandler.httpProtocol, this.proxyHandler.httpHost),
			caldavEventsUrl: calendar.generateCaldavEventsUrl(this.proxyHandler.httpProtocol, this.proxyHandler.httpHost)
		} as CalendarModel;
	}
}