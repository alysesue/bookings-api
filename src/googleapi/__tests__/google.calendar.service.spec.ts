import { GoogleCalendarService } from '../google.calendar.service';
import { calendar_v3 } from 'googleapis';
import * as mockEvents from './createEventResponse.json';
import { Container } from 'typescript-ioc';
import { GoogleApi } from '../google.api';
import { BookingBuilder } from '../../models/entities/booking';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

const calendarMock = jest.fn();
const queryMock = jest.fn();

describe('Google calendar wrapper tests', () => {
	beforeAll(() => {
		Container.bind(GoogleApi).to(GoogleApiMock);
	});

	beforeEach(() => {
		calendarMock.mockImplementation(() => ({
			freebusy: jest.fn().mockImplementation(() => ({
				query: queryMock,
			})),
		}));
		jest.mock('googleapis', () => ({
			calendar_v3: {
				Calendar: calendarMock,
			},
			google: jest.fn(),
		}));
	});

	it('should return available calendars', async () => {
		const startDate = new Date();
		const endDate = startDate;

		const calendars = [{ id: '1' }];

		const query = {
			data: {
				calendars: { '1': { busy: [] } },
			},
		};

		GoogleApiMock.mockQueryResponse = query;

		const googleService = Container.get(GoogleCalendarService);
		const result = await googleService.getAvailableGoogleCalendars(startDate, endDate, calendars);

		expect(result).toBe(query.data.calendars);
	});

	it('should create calendar', async () => {
		GoogleApiMock.insertCalendarsMock = {
			data: {
				id: 'google-id',
			},
		};
		const calendarId = await Container.get(GoogleCalendarService).createCalendar();
		expect(calendarId).toBe('google-id');
	});

	it('should remove calendar', async () => {
		GoogleApiMock.deleteEventsMock = jest.fn();
		await Container.get(GoogleCalendarService).deleteEvent('cal-id', 'event-id');
		expect(GoogleApiMock.deleteEventsMock).toBeCalled();
	});

	it('should add user access', async () => {
		GoogleApiMock.mockAclInsertResponse = {
			data: {
				scope: {
					value: 'example@email.com',
				},
			},
		};

		const result = await Container.get(GoogleCalendarService).addCalendarUser('uuid', {
			role: 'reader',
			email: 'example@email.com',
		});

		expect(result);
	});

	it('should return ical UID on create event', async () => {
		const createEvents = mockEvents;

		const googleService = Container.get(GoogleCalendarService);
		GoogleApiMock.createEventsMock = createEvents;
		const testBooking1 = new BookingBuilder()
			.withServiceId(1)
			.withStartDateTime(new Date('2020-10-01T01:00:00'))
			.withEndDateTime(new Date('2020-10-01T02:00:00'))
			.build();

		const result = await googleService.createEvent(testBooking1, 'calendar-id');

		expect(result).toBe('s1ov9v4ic15vcs30dtfgeoclg8@google.com');
	});
});

class GoogleApiMock implements Partial<GoogleApi> {
	public static mockAclInsertResponse;
	public static mockQueryResponse;
	public static insertCalendarsMock;
	public static createEventsMock;
	public static deleteEventsMock;

	public async getCalendarApi(): Promise<calendar_v3.Calendar> {
		return {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			acl: {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				insert: () => GoogleApiMock.mockAclInsertResponse,
			},
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			freebusy: {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				query: () => GoogleApiMock.mockQueryResponse,
			},
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			calendars: {
				insert: () => GoogleApiMock.insertCalendarsMock,
			},
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			events: {
				insert: () => GoogleApiMock.createEventsMock,
				delete: (param: any) => GoogleApiMock.deleteEventsMock(param),
			},
		};
	}
}
