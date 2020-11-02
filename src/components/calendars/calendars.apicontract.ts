/**
 * @deprecated The class should not be used, it has been created at the start of the project to link booking with google calendar (with caldav protocole). We dont use it anymore
 */
export class CalendarModel {
	public uuid: string;
	public externalCalendarUrl: string;
	public caldavUserUrl: string;
	public caldavEventsUrl: string;
}

/**
 * @deprecated The class should not be used, it has been created at the start of the project to link booking with google calendar (with caldav protocole). We dont use it anymore
 */
export class CalendarUserModel {
	/**
	 * Google account email address
	 */
	public email: string;
	/**
	 * Role: reader or writer.
	 */
	public role: string;
}
