import { OneOffTimeslotRequestV2 } from '../../oneOffTimeslots/oneOffTimeslots.apicontract';
import { EventOneOffTimeslotRequest, EventRequest } from '../events.apicontract';
import { Container } from 'typescript-ioc';
import { EventsService } from '../events.service';
import { LabelsService } from '../../labels/labels.service';
import { LabelsServiceMock } from '../../labels/__mocks__/labels.service.mock';
import { ServicesService } from '../../services/services.service';
import { ServicesServiceMock } from '../../services/__mocks__/services.service';
import { UserContext } from '../../../infrastructure/auth/userContext';
import { UserContextMock } from '../../../infrastructure/auth/__mocks__/userContext';
import { AsyncFunction, TransactionManager } from '../../../core/transactionManager';
import { TransactionManagerMock } from '../../../core/__mocks__/transactionManager.mock';
import { EventsRepository } from '../events.repository';
import { EventsRepositoryMock } from '../__mocks__/events.repository.mock';
import { IsolationLevel } from 'typeorm/driver/types/IsolationLevel';
import { OneOffTimeslotsService } from '../../oneOffTimeslots/oneOffTimeslots.service';
import { OneOffTimeslotsServiceMock } from '../../oneOffTimeslots/__mocks__/oneOffTimeslots.service.mock';
import { ContainerContextHolder } from '../../../infrastructure/containerContext';
import { IdHasher } from '../../../infrastructure/idHasher';
import { IdHasherMock } from '../../../infrastructure/__mocks__/idHasher.mock';
import { ChangeLogAction, Event, OneOffTimeslot, Organisation, Service, User } from '../../../models';
import { OrganisationAdminAuthGroup } from '../../../infrastructure/auth/authGroup';
import { OneOffTimeslotsActionAuthVisitor } from '../../oneOffTimeslots/oneOffTimeslots.auth';
import { getOneOffTimeslotMock } from '../../../models/__mocks__/oneOffTimeslot.mock';
import { ServiceProvidersService } from '../../serviceProviders/serviceProviders.service';
import { ServiceProvidersServiceMock } from '../../serviceProviders/__mocks__/serviceProviders.service.mock';
import { OneOffTimeslotsRepository } from '../../oneOffTimeslots/oneOffTimeslots.repository';
import { OneOffTimeslotsRepositoryMock } from '../../oneOffTimeslots/__mocks__/oneOffTimeslots.repository.mock';
import { EventsAuthVisitor } from '../events.auth';
import { getServiceProviderMock } from '../../../models/__mocks__/serviceProvider.mock';
import { BookedSlotRepository } from '../../bookings/bookedSlot.repository';
import { BookedSlotRepositoryMock } from '../../bookings/__mocks__/bookedSlot.repository.mock';
import { BookingsServiceMock } from '../../bookings/__mocks__/bookings.service.mock';
import { BookingsService } from '../../bookings';
import {
	BookingChangeLogsService,
	BookingsActionFunction,
	GetBookingsFunctionByEventId,
} from '../../bookingChangeLogs/bookingChangeLogs.service';
import { BookingChangeLogsServiceMock } from '../../bookings/__mocks__/bookings.mocks';

jest.mock('../events.auth');
jest.mock('../events.validation');

describe('Tests events services', () => {
	const authVisitorMock: Partial<OneOffTimeslotsActionAuthVisitor> = {
		hasPermission: jest.fn(),
	};
	const getSimpleOneOffTimeslotRequest = ({ serviceProviderId }) =>
		({
			startDateTime: new Date('2022-01-01T14:00:00.000Z'),
			endDateTime: new Date('2022-01-01T14:10:00.000Z'),
			serviceProviderId: serviceProviderId || 1,
		} as OneOffTimeslotRequestV2);

	const getSimpleEventRequest = ({ oneOffTimeslots }: { oneOffTimeslots: OneOffTimeslotRequestV2[] }) =>
		({
			title: 'event title',
			serviceId: '1',
			timeslots: oneOffTimeslots,
		} as EventRequest);

	const getSimpleEventOneOffTimeslotRequest = ({ oneOffTimeslot }: { oneOffTimeslot?: OneOffTimeslot }) =>
		({
			serviceId: '10',
			timeslot: oneOffTimeslot || getOneOffTimeslotMock({}),
		} as EventOneOffTimeslotRequest);

	beforeAll(() => {
		ContainerContextHolder.registerInContainer();

		Container.bind(IdHasher).to(IdHasherMock);
		Container.bind(LabelsService).to(LabelsServiceMock);
		Container.bind(OneOffTimeslotsService).to(OneOffTimeslotsServiceMock);
		Container.bind(OneOffTimeslotsRepository).to(OneOffTimeslotsRepositoryMock);
		Container.bind(ServiceProvidersService).to(ServiceProvidersServiceMock);
		Container.bind(ServicesService).to(ServicesServiceMock);
		Container.bind(UserContext).to(UserContextMock);
		Container.bind(TransactionManager).to(TransactionManagerMock);
		Container.bind(EventsRepository).to(EventsRepositoryMock);
		Container.bind(BookedSlotRepository).to(BookedSlotRepositoryMock);
		Container.bind(BookingsService).to(BookingsServiceMock);
		Container.bind(BookingChangeLogsService).to(BookingChangeLogsServiceMock);
	});

	beforeEach(() => {
		jest.resetAllMocks();
		(EventsAuthVisitor as jest.Mock).mockImplementation(() => authVisitorMock);
		(authVisitorMock.hasPermission as jest.Mock).mockReturnValue(true);
		(IdHasherMock.decode as jest.Mock).mockImplementation((s) => parseInt(s, 10));
		TransactionManagerMock.runInTransaction.mockImplementation(
			async <T>(_isolationLevel: IsolationLevel, asyncFunction: AsyncFunction<T>): Promise<T> =>
				await asyncFunction(),
		);
		ServicesServiceMock.getService.mockReturnValue(Service.create('Service', { id: 1 } as Organisation));
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([
				new OrganisationAdminAuthGroup(User.createAgencyUser({ agencyAppId: '1', agencyName: 'test' }), [
					{ id: 1 } as Organisation,
				]),
			]),
		);
		BookingChangeLogsServiceMock.executeAndLogMultipleActions.mockImplementation(
			async (
				getBookingsFunction: GetBookingsFunctionByEventId,
				actionFunction: BookingsActionFunction,
				eventId?: number,
			) => {
				await getBookingsFunction(eventId, {});
				const [action, newBookings] = await actionFunction();
				BookingChangeLogsServiceMock.action = action;
				return newBookings;
			},
		);
	});

	it('Should call save when create an oneOffTimeslot event', async () => {
		const eventRequest = getSimpleEventOneOffTimeslotRequest({});
		await Container.get(EventsService).saveOneOffTimeslot(eventRequest);
		expect(ServicesServiceMock.getService).toHaveBeenCalledTimes(1);
		expect(LabelsServiceMock.verifyLabelsMock).toHaveBeenCalledTimes(1);
		expect(EventsRepositoryMock.saveMock).toHaveBeenCalledTimes(1);
	});

	it('Should call save when updating an oneOffTimeslot event', async () => {
		const eventRequest = getSimpleEventOneOffTimeslotRequest({});
		await Container.get(EventsService).updateOneOffTimeslot(eventRequest, new Event());
		expect(ServicesServiceMock.getService).toHaveBeenCalledTimes(1);
		expect(LabelsServiceMock.verifyLabelsMock).toHaveBeenCalledTimes(1);
		expect(EventsRepositoryMock.saveMock).toHaveBeenCalledTimes(1);
	});

	it('Should call save when create an event', async () => {
		const oneOffTimeslotRequest = getSimpleOneOffTimeslotRequest({ serviceProviderId: 1 });
		const oneOffTimeslotRequest2 = getSimpleOneOffTimeslotRequest({ serviceProviderId: 2 });
		const sp1 = getServiceProviderMock({ id: 1 });
		const sp2 = getServiceProviderMock({ id: 2 });
		ServiceProvidersServiceMock.getServiceProvidersMock.mockReturnValue([sp1, sp2]);
		const eventRequest = getSimpleEventRequest({
			oneOffTimeslots: [oneOffTimeslotRequest, oneOffTimeslotRequest2],
		});
		await Container.get(EventsService).saveEvent(eventRequest);
		expect(ServicesServiceMock.getService).toHaveBeenCalledTimes(1);
		expect(LabelsServiceMock.verifyLabelsMock).toHaveBeenCalledTimes(1);
		expect(ServiceProvidersServiceMock.getServiceProvidersMock).toHaveBeenCalledTimes(1);
		expect(EventsRepositoryMock.saveMock).toHaveBeenCalledTimes(1);
	});

	it('Should call save when updating an event', async () => {
		(BookingsServiceMock.mockGetAllBookingsByEventId as jest.Mock).mockReturnValue(new Event());
		(EventsRepositoryMock.getByIdMock as jest.Mock).mockReturnValue(new Event());

		const oneOffTimeslotRequest = getSimpleOneOffTimeslotRequest({ serviceProviderId: 1 });
		const oneOffTimeslotRequest2 = getSimpleOneOffTimeslotRequest({ serviceProviderId: 2 });
		const sp1 = getServiceProviderMock({ id: 1 });
		const sp2 = getServiceProviderMock({ id: 2 });
		ServiceProvidersServiceMock.getServiceProvidersMock.mockReturnValue([sp1, sp2]);
		const eventRequest = getSimpleEventRequest({
			oneOffTimeslots: [oneOffTimeslotRequest, oneOffTimeslotRequest2],
		});

		await Container.get(EventsService).updateEvent(eventRequest, '1');
		expect(BookingsServiceMock.mockGetAllBookingsByEventId).toHaveBeenCalledTimes(1);
		expect(BookingChangeLogsServiceMock.action).toEqual(ChangeLogAction.Update);
		expect(EventsRepositoryMock.saveMock).toHaveBeenCalledTimes(1);
	});

	it('Should call search repo when looking for events', async () => {
		(EventsRepositoryMock.searchMock as jest.Mock).mockReturnValue([]);
		await Container.get(EventsService).search({ serviceId: 1, page: 1, limit: 1 });
		expect(EventsRepositoryMock.searchMock.mock.calls[0][0].isOneOffTimeslot).toBe(false);
		expect(EventsRepositoryMock.searchMock).toHaveBeenCalledTimes(1);
	});

	it('Should call delete repo when delete an event', async () => {
		(EventsRepositoryMock.getByIdMock as jest.Mock).mockReturnValue(new Event());
		await Container.get(EventsService).deleteById(1);
		expect(EventsRepositoryMock.getByIdMock).toHaveBeenCalledTimes(1);
		expect(OneOffTimeslotsRepositoryMock.delete).toHaveBeenCalledTimes(1);
		expect(EventsRepositoryMock.deleteMock).toHaveBeenCalledTimes(1);
	});
});
