import { GoogleCalendarService } from "../google.calendar.service";
import { calendar_v3 } from "googleapis";
import * as mockEvents from "./createEventResponse.json";
import { Booking } from "../../models";

const calendarMock = jest.fn();
const queryMock = jest.fn();

describe("Google calendar wrapper tests", () => {
  beforeEach(() => {
    calendarMock.mockImplementation(() => ({
      freebusy: jest.fn().mockImplementation(() => ({
        query: queryMock,
      })),
    }));
    jest.mock("googleapis", () => ({
      calendar_v3: {
        Calendar: calendarMock,
      },
      google: jest.fn(),
    }));
  });

  it("should return available calendars", async () => {
    const startDate = new Date();
    const endDate = startDate;

    const calendars = [{ id: "1" }];

    const query = {
      data: {
        calendars: { "1": { busy: [] } },
      },
    };

    const result = await new GoogleCalendarApiWrapperMock(
      query,
      {},
      {}
    ).getAvailableGoogleCalendars(startDate, endDate, calendars);

    expect(result).toBe(query.data.calendars);
  });

  it("should create calendar", async () => {
    const calendarsResponse = {
      data: {
        id: "google-id",
      },
    };
    const calendarId = await new GoogleCalendarApiWrapperMock(
      {},
      calendarsResponse,
      {}
    ).createCalendar();
    expect(calendarId).toBe("google-id");
  });

  it("should call google auth when no token", async () => {
    jest.mock("googleapis", () => ({
      google: {
        auth: {
          JWT: jest.fn(),
        },
      },
    }));
    const result = await new GoogleCalendarService().getCalendarApi();

    expect(result);
  });

  it("should add user access", async () => {
    const aclInsertResponse = {
      data: {
        scope: {
          value: "example@email.com",
        },
      },
    };

    const result = await new GoogleCalendarApiWrapperMock(
      {},
      {},
      aclInsertResponse
    ).addCalendarUser("uuid", { role: "reader", email: "example@email.com" });

    expect(result);
  });

  it("should return ical UID on create event", async () => {
    const createEvents = mockEvents;

    const googleService = new GoogleCalendarApiWrapperMock({}, {}, {});
    googleService.createEventMock = createEvents;

    const result = await googleService.createEvent(
      new Booking(new Date(), 60),
      "calendar-id"
    );

    expect(result).toBe("s1ov9v4ic15vcs30dtfgeoclg8@google.com");
  });
});

class GoogleCalendarApiWrapperMock extends GoogleCalendarService {
  private mockAclInsertResponse;
  private mockQueryResponse;
  private insertCalendarsMock;
  private _createEventsMock;

  public set createEventMock(mock: any) {
    this._createEventsMock = mock;
  }

  constructor(mockQueryResponse, insertCalendarsMock, mockAclInsertResponse) {
    super();
    super.setToken("fake-token");
    this.mockQueryResponse = mockQueryResponse;
    this.insertCalendarsMock = insertCalendarsMock;
    this.mockAclInsertResponse = mockAclInsertResponse;
  }

  public async getCalendarApi(): Promise<calendar_v3.Calendar> {
    return {
      // @ts-ignore
      acl: {
        // @ts-ignore
        insert: () => this.mockAclInsertResponse,
      },
      // @ts-ignore
      freebusy: {
        // @ts-ignore
        query: () => this.mockQueryResponse,
      },
      // @ts-ignore
      calendars: {
        insert: () => this.insertCalendarsMock,
      },
      // @ts-ignore
      events: {
        insert: () => this._createEventsMock,
      },
    };
  }
}
