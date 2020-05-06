import { CalendarsRepository } from '../calendars.repository';
import { Container, ObjectFactory, Snapshot } from 'typescript-ioc';
import { Calendar } from '../../models/calendar';
import { CalendarsService } from '../calendars.service';
import { calendar_v3 } from "googleapis";
import { GoogleCalendarApiWrapper } from "../../googleapi/calendarwrapper";

let snapshot: Snapshot;
beforeAll(function () {
	// Store the IoC configuration
	snapshot = Container.snapshot();

	Container.bind(CalendarsRepository).to(CalendarRepositoryMock);
	Container.bind(GoogleCalendarApiWrapper).to(GoogleCalendarApiWrapperMock);

	// Clears mock counters, not implementation
	jest.clearAllMocks();
});

afterAll(function () {
	// Put the IoC configuration back for IService, so other tests can run.
	snapshot.restore();
});

describe('Calendar service', () => {
	it('should get calendars', async () => {
		const service = Container.get(CalendarsService);

		const result = await service.getCalendars();
		expect(result).not.toBe(undefined);

		expect(CalendarRepositoryObj.getCalendars).toBeCalled();
	});

	it('should save calendars', async () => {
		const service = Container.get(CalendarsService);

		const result = await service.createCalendar();
		expect(result).not.toBe(undefined);

		expect(CalendarRepositoryObj.saveCalendar).toBeCalled();
	});

	it('should add user access', async () => {
		const service = Container.get(CalendarsService);

		const result = await service.addUser('uuid', { email: 'test@palo-it.com' });
		expect(result.email).not.toBe(undefined);

		expect(CalendarRepositoryObj.getCalendarByUUID).toHaveBeenCalled();
	});
});

const CalendarObjMock = {
	id: 1,
	uuid: 'uuid',
	googleCalendarId: 'googleid@group.calendar.google.com'
} as Calendar;

const CalendarRepositoryObj = {
	getCalendars: jest.fn().mockImplementation(() => Promise.resolve([])),
	saveCalendar: jest.fn().mockImplementation(() => Promise.resolve({})),
	getCalendarByUUID: jest.fn().mockImplementation(() => Promise.resolve(CalendarObjMock))
};

const CalendarRepositoryMock = jest.fn().mockImplementation(() => CalendarRepositoryObj);

const acl_insert_response = {
	data: {
		scope: {
			value: 'example@email.com'
		}
	}
};

const calendars_insert_response = {
	data: {
		id: 'googleid@group.calendar.google.com'
	}
};

const GoogleCalendarApiMock = {
	acl: {
		insert: () => Promise.resolve(acl_insert_response)
	},
	calendars: {
		insert: () => Promise.resolve(calendars_insert_response)
	}
} as calendar_v3.Calendar;

const GoogleCalendarApiWrapperMock = jest.fn().mockImplementation(() => {
	return {
		getCalendarApi: () => GoogleCalendarApiMock
	};
});
