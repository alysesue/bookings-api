import { Container } from 'typescript-ioc';
import { CalendarsService } from '../calendars.service';
import { CalendarUserModel } from '../calendars.apicontract';
import { CalendarsController } from '../calendars.controller';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

describe('Calendars.controller', () => {
	beforeAll(() => {
		Container.bind(CalendarsService).to(CalendarsServiceMock);
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	it('should add user', async () => {
		const request = new CalendarUserModel();
		request.email = 'test@gmail.com';
		request.role = 'reader';

		CalendarsServiceMock.addUserMock.mockImplementation(() => Promise.resolve(request));
		const controller = Container.get(CalendarsController);
		const result = await controller.addUser('uuid', request);

		expect(result).toBeDefined();
		expect(CalendarsServiceMock.addUserMock).toHaveBeenCalled();
	});
});

class CalendarsServiceMock implements Partial<CalendarsService> {
	public static addUserMock = jest.fn();

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async addUser(calendarUUID: string, model: CalendarUserModel): Promise<CalendarUserModel> {
		return await CalendarsServiceMock.addUserMock();
	}
}
