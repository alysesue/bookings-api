import {GoogleCalendarService} from "../google.calendar.service";
import {calendar_v3} from "googleapis";

const calendarMock = jest.fn();
const queryMock = jest.fn();

describe('Google calendar wrapper tests', () => {
	beforeEach(() => {
		calendarMock.mockImplementation(() => ({
			freebusy: jest.fn().mockImplementation(() => ({
				query: queryMock
			}))
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

		const calendars = [{id: '1'}];

		const query = {
			data: {
				calendars: {'1': {busy: []}}
			}
		};

		const result = await new GoogleCalendarApiWrapperMock(query, {})
			.getAvailableGoogleCalendars(startDate, endDate, calendars);

		expect(result).toBe(query.data.calendars);

	});

	it('should create calendar', async () => {
		const calendarsResponse = {
			data: {
				id: 'google-id'
			}
		};
		const calendarId = await new GoogleCalendarApiWrapperMock({}, calendarsResponse)
			.createCalendar();
		expect(calendarId).toBe('google-id');
	});

	it('should call google auth when no token', async () => {
		jest.mock('googleapis', () => ({
			google: {
				auth: {
					JWT: jest.fn(),
				}
			}
		}));
		const result = await new GoogleCalendarService().getCalendarApi();

		expect(result);
	});
});


class GoogleCalendarApiWrapperMock extends GoogleCalendarService {

	private mockQueryResponse;
	private insertCalendarsMock;

	constructor(mockQueryResponse, insertCalendarsMock) {
		super();
		super.setToken('fake-token');
		this.mockQueryResponse = mockQueryResponse;
		this.insertCalendarsMock = insertCalendarsMock;
	}

	public async getCalendarApi(): Promise<calendar_v3.Calendar> {
		return {
			// @ts-ignore
			freebusy: {
				// @ts-ignore
				query: () => (this.mockQueryResponse),
			},
			// @ts-ignore
			calendars: {
				insert: () => (this.insertCalendarsMock)
			}
		};
	}
}
