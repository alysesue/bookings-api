import { Container } from 'typescript-ioc';
import { EventsService } from '../events.service';
import { EventsServiceMock } from '../__mocks__/events.service.mock';
import { EventsController } from '../events.controller';
import { EventRequest } from '../events.apicontract';
import { IdHasher } from '../../../infrastructure/idHasher';
import { IdHasherMock } from '../../../infrastructure/__mocks__/idHasher.mock';
import { BookingsService } from '../../bookings';
import {
	Booking,
	BookingChangeLog,
	Event,
	OneOffTimeslot,
	Organisation,
	Service,
	User,
} from '../../../models/entities';
import { IPagedEntities } from '../../../core/pagedEntities';
import { BookingBuilder } from '../../../models/entities/booking';
import { getConfig } from '../../../config/app-config';
import { UserContext } from '../../../infrastructure/auth/userContext';
import { UserContextMock } from '../../../infrastructure/auth/__mocks__/userContext';
import { OrganisationAdminAuthGroup } from '../../../infrastructure/auth/authGroup';
import { BookingsServiceMock } from '../../bookings/__mocks__/bookings.service.mock';
import { EventBookingRequest } from '../../bookings/bookings.apicontract';
import { BookingsMapper } from '../../bookings/bookings.mapper';
import { BookingsMapperMock } from '../../bookings/__mocks__/bookings.mapper.mock';

describe('Test events controller', () => {
	const adminMock = User.createAdminUser({
		molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
		userName: 'UserName',
		email: 'test@email.com',
		name: 'Name',
	});

	const organisation = new Organisation();
	organisation.id = 1;

	const eventMock = new Event();
	eventMock.id = 1;
	eventMock.oneOffTimeslots = [
		{
			startDateTime: new Date(),
			endDateTime: new Date(),
			id: 1,
			serviceProvider: { id: 1, name: 'a' },
		} as OneOffTimeslot,
	];
	eventMock.service = { name: 'name', id: 1, organisationId: 1 };

	beforeAll(() => {
		Container.bind(EventsService).to(EventsServiceMock);
		Container.bind(IdHasher).to(IdHasherMock);
		Container.bind(UserContext).to(UserContextMock);
		Container.bind(BookingsService).to(BookingsServiceMock);
		Container.bind(BookingsMapper).to(BookingsMapperMock);
	});

	beforeEach(() => {
		jest.resetAllMocks();
		IdHasherMock.encode.mockImplementation((id: number) => id.toString());
		IdHasherMock.decode.mockImplementation((id: string) => Number.parseInt(id, 10));
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new OrganisationAdminAuthGroup(adminMock, [organisation])]),
		);

		UserContextMock.getSnapshot.mockReturnValue(
			Promise.resolve({
				user: adminMock,
				authGroups: [new OrganisationAdminAuthGroup(adminMock, [organisation])],
			}),
		);
	});

	it('Should call search service', () => {
		(EventsServiceMock.search as jest.Mock).mockReturnValue({
			entries: [],
			page: 1,
			limit: 1,
		});
		Container.get(EventsController).search('1');
		expect(EventsServiceMock.search).toHaveBeenCalledTimes(1);
	});

	it('Should call getById service', () => {
		(EventsServiceMock.getById as jest.Mock).mockReturnValue(eventMock);
		Container.get(EventsController).searchById('i');
		expect(EventsServiceMock.getById).toHaveBeenCalledTimes(1);
	});

	it('Should call create service', () => {
		(EventsServiceMock.saveEvent as jest.Mock).mockReturnValue(eventMock);
		Container.get(EventsController).post({} as EventRequest);
		expect(EventsServiceMock.saveEvent).toHaveBeenCalledTimes(1);
	});

	it('Should call update service', () => {
		(EventsServiceMock.updateEvent as jest.Mock).mockReturnValue(eventMock);
		Container.get(EventsController).update('asdf', {} as EventRequest);
		expect(EventsServiceMock.updateEvent).toHaveBeenCalledTimes(1);
	});

	it('Should call delete service', () => {
		Container.get(EventsController).delete('asdf');
		expect(EventsServiceMock.deleteById).toHaveBeenCalledTimes(1);
	});

	it('Should call get booking service', async () => {
		const serviceMock = new Service();
		serviceMock.id = 1;
		serviceMock.organisation = organisation;
		serviceMock.organisationId = organisation.id;

		eventMock.service = serviceMock;
		eventMock.serviceId = serviceMock.id;

		const testBooking1 = new BookingBuilder()
			.withServiceId(1)
			.withSlots([[new Date('2020-10-01T01:00:00Z'), new Date('2020-10-01T02:00:00Z'), null]])
			.withStartDateTime(new Date('2020-10-01T01:00:00Z'))
			.withEndDateTime(new Date('2020-10-01T02:00:00Z'))
			.withEventId(1)
			.build();
		testBooking1.id = 1;
		testBooking1.createdLog = new BookingChangeLog();
		testBooking1.createdLog.timestamp = new Date('2020-01-01T01:01:01Z');
		testBooking1.service = new Service();
		testBooking1.service.organisation = organisation;
		testBooking1.event = eventMock;

		BookingsServiceMock.searchBookings.mockImplementation(() =>
			Promise.resolve({
				entries: [testBooking1],
			} as IPagedEntities<Booking>),
		);
		(getConfig as jest.Mock).mockReturnValue({
			featureFlag: {
				lifeSGSync: 'true',
			},
		});
		BookingsServiceMock.mockCheckLimit.mockImplementation();

		const controller = Container.get(EventsController);

		await controller.getBookings('1', undefined, undefined, undefined);

		expect(BookingsServiceMock.searchBookings).toHaveBeenCalledWith({
			eventId: 1,
			page: 1,
			limit: 100,
			maxId: undefined,
		});
	});

	it('Should call create event booking', async () => {
		(BookingsServiceMock.bookAnEventMock as jest.Mock).mockReturnValue({ id: 1, eventId: 1 });
		(BookingsMapperMock.mapEventsDataModel as jest.Mock).mockReturnValue({});
		Container.get(EventsController).createEventBooking('hashedEventId', {} as EventBookingRequest);
		expect(BookingsServiceMock.bookAnEventMock).toHaveBeenCalledTimes(1);
	});
});
