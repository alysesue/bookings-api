import { Inject, InRequestScope } from 'typescript-ioc';
import { CalendarModel } from './calendars.apicontract';
import { CalDavProxyHandler } from '../../infrastructure/caldavproxy.handler';
import { CalendarTimezone } from '../../const';
import { Calendar } from '../../models/entities/calendar';

/**
 * @deprecated The class should not be used, it has been created at the start of the project to link booking with google calendar (with caldav protocole). We dont use it anymore
 */
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
			externalCalendarUrl: calendar.generateExternalUrl(CalendarTimezone),
			caldavUserUrl: calendar.generateCaldavUserUrl(this.proxyHandler.httpProtocol, this.proxyHandler.httpHost),
			caldavEventsUrl: calendar.generateCaldavEventsUrl(
				this.proxyHandler.httpProtocol,
				this.proxyHandler.httpHost,
			),
		} as CalendarModel;
	}
}
