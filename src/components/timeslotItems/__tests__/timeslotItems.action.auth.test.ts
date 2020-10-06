import { BookingBuilder } from '../../../models/entities/booking';
import { Calendar, ChangeLogAction, Organisation, Service, ServiceProvider, User, TimeslotsSchedule } from '../../../models';
import { TimeslotItemsActionAuthVisitor } from '../timeslotItems.auth';
import {
	CitizenAuthGroup,
	OrganisationAdminAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../../../infrastructure/auth/authGroup';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

// tslint:disable-next-line: no-big-function
describe('TimeslotItems action auth', () => {
	const organisation = new Organisation();
	organisation.id = 2;

	const service = new Service();
	service.id = 3;
	service.name = 'service';
	service.organisationId = organisation.id;
	service.organisation = organisation;

	const singpassMock = User.createSingPassUser('d080f6ed-3b47-478a-a6c6-dfb5608a199d', 'ABC1234');
	const adminMock = User.createAdminUser({
		molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
		userName: 'UserName',
		email: 'test@email.com',
		name: 'Name',
	});

	it('should validate param to have service or service provider', async () => {
		const timeslotsScheduleMock = new TimeslotsSchedule();

		const groups = [new CitizenAuthGroup(singpassMock)];

		expect(new TimeslotItemsActionAuthVisitor(timeslotsScheduleMock).hasPermission(groups)).toThrowError();
	});
	it('should validate citizen action permission', async () => {
		const serviceMock = new Service();
		const timeslotsScheduleMock = new TimeslotsSchedule();
		timeslotsScheduleMock._service = serviceMock;

		const groups = [new CitizenAuthGroup(singpassMock)];

		expect(new TimeslotItemsActionAuthVisitor(timeslotsScheduleMock).hasPermission(groups)).toBe(false);
	});
});
