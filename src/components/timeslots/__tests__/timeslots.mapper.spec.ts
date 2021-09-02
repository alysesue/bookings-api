import { BookingBuilder } from '../../../models/entities/booking';
import { AvailableTimeslotProviders } from '../availableTimeslotProviders';
import { Booking, ServiceProvider } from '../../../models';
import { TimeslotsMapperV1, TimeslotsMapperV2 } from '../timeslots.mapper';
import { TimeslotWithCapacity } from '../../../models/timeslotWithCapacity';
import { Container } from 'typescript-ioc';
import { ServiceProvidersLookup } from '../aggregatorTimeslotProviders';
import { IdHasherMock } from '../../../infrastructure/__mocks__/idHasher.mock';
import { IdHasher } from '../../../infrastructure/idHasher';
import { UinFinConfigurationMock } from '../../../models/__mocks__/uinFinConfiguration.mock';

jest.mock('../../../models/uinFinConfiguration');

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});
beforeEach(() => {
	jest.resetAllMocks();
});

describe('Timeslots Mapper V1', () => {
	beforeAll(() => {
		Container.bind(IdHasher).to(IdHasherMock);
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	it('should map timeslot entry V1', async () => {
		const entry = new AvailableTimeslotProviders(new ServiceProvidersLookup());
		entry.startTime = new Date('2020-09-26T00:00:00.000Z').getTime();
		entry.endTime = new Date('2020-09-26T00:30:00.000Z').getTime();
		const spData = ServiceProvider.create('SP1', 1);
		spData.id = 1;
		entry.addServiceProvider(spData, {
			startTimeNative: entry.startTime,
			endTimeNative: entry.endTime,
			capacity: 1,
		} as TimeslotWithCapacity);

		const mapper = Container.get(TimeslotsMapperV1);
		const res = await mapper.mapTimeslotEntryV1(entry);
		expect(res).toEqual({
			endTime: new Date('2020-09-26T00:30:00.000Z'),
			startTime: new Date('2020-09-26T00:00:00.000Z'),
			timeslotServiceProviders: [
				{
					acceptedBookings: [],
					assignedBookingCount: 0,
					availabilityCount: 1,
					capacity: 1,
					eventDescription: undefined,
					eventTitle: undefined,
					isRecurring: false,
					labels: [],
					pendingBookings: [],
					serviceProvider: { id: 1, name: 'SP1' },
				},
			],
			totalAssignedBookingCount: 0,
			totalAvailabilityCount: 1,
			totalCapacity: 1,
			totalUnassignedBookingCount: 0,
		});
	});

	it('should map availability V1', () => {
		const entry = new AvailableTimeslotProviders(new ServiceProvidersLookup());
		entry.startTime = new Date('2020-09-26T00:00:00.000Z').getTime();
		entry.endTime = new Date('2020-09-26T00:30:00.000Z').getTime();

		const spData = ServiceProvider.create('Timmy', 1);
		spData.id = 1;

		entry.addServiceProvider(spData, {
			startTimeNative: entry.startTime,
			endTimeNative: entry.endTime,
			capacity: 1,
		} as TimeslotWithCapacity);

		const mapper = Container.get(TimeslotsMapperV1);
		const res = mapper.mapAvailabilityToResponseV1([entry], {})[0];

		expect(res.availabilityCount).toBe(1);
		expect(res.startTime.toISOString()).toBe('2020-09-26T00:00:00.000Z');
		expect(res.endTime.toISOString()).toBe('2020-09-26T00:30:00.000Z');
	});

	it('should map service provider timeslot V1', async () => {
		const entry = new AvailableTimeslotProviders(new ServiceProvidersLookup());
		entry.startTime = new Date(2020, 8, 26, 8, 0).getTime();
		entry.endTime = new Date(2020, 8, 26, 8, 30).getTime();

		const serviceProvider1 = ServiceProvider.create('Timmy', 1);
		serviceProvider1.id = 1;
		const serviceProvider2 = ServiceProvider.create('Andy', 1);
		serviceProvider2.id = 2;

		entry.addServiceProvider(serviceProvider1, {
			startTimeNative: entry.startTime,
			endTimeNative: entry.endTime,
			capacity: 1,
		} as TimeslotWithCapacity);
		entry.addServiceProvider(serviceProvider2, {
			startTimeNative: entry.startTime,
			endTimeNative: entry.endTime,
			capacity: 5,
		} as TimeslotWithCapacity);

		const timeslotServiceProviders = Array.from(entry.getTimeslotServiceProviders());
		UinFinConfigurationMock.canViewPlainUinFin.mockReturnValue(false);

		const mapper = Container.get(TimeslotsMapperV1);
		const res = await mapper.mapTimeslotServiceProvidersV1(timeslotServiceProviders);

		const [spResponse, totalCapacity, totalBooked] = res;
		expect(spResponse.length).toBe(2);
		expect(spResponse[0].capacity).toBe(1);
		expect(spResponse[1].capacity).toBe(5);
		expect(totalCapacity).toBe(6);
		expect(totalBooked).toBe(0);
	});

	it('should map service provider timeslot title and description - admin side V1', async () => {
		const entry = new AvailableTimeslotProviders(new ServiceProvidersLookup());
		entry.startTime = new Date(2020, 8, 26, 8, 0).getTime();
		entry.endTime = new Date(2020, 8, 26, 8, 30).getTime();

		const serviceProvider1 = ServiceProvider.create('Timmy', 1);
		serviceProvider1.id = 1;
		const serviceProvider2 = ServiceProvider.create('Andy', 1);
		serviceProvider2.id = 2;

		entry.addServiceProvider(serviceProvider1, {
			startTimeNative: entry.startTime,
			endTimeNative: entry.endTime,
			capacity: 1,
			title: 'Title Test - serviceProvider1',
			description: 'Description Test - serviceProvider1',
		} as TimeslotWithCapacity);
		entry.addServiceProvider(serviceProvider2, {
			startTimeNative: entry.startTime,
			endTimeNative: entry.endTime,
			capacity: 5,
			title: 'Title Test - serviceProvider2',
			description: 'Description Test - serviceProvider2',
		} as TimeslotWithCapacity);

		const timeslotServiceProviders = Array.from(entry.getTimeslotServiceProviders());
		UinFinConfigurationMock.canViewPlainUinFin.mockReturnValue(false);

		const mapper = Container.get(TimeslotsMapperV1);
		const res = await mapper.mapTimeslotServiceProvidersV1(timeslotServiceProviders);

		const [spResponse] = res;
		expect(spResponse.length).toBe(2);
		expect(spResponse[0].eventTitle).toBe('Title Test - serviceProvider1');
		expect(spResponse[1].eventTitle).toBe('Title Test - serviceProvider2');
		expect(spResponse[0].eventDescription).toBe('Description Test - serviceProvider1');
		expect(spResponse[1].eventDescription).toBe('Description Test - serviceProvider2');
	});

	it('should map service provider timeslot title and description - citizen side V1', () => {
		const entry = new AvailableTimeslotProviders(new ServiceProvidersLookup());
		entry.startTime = new Date(2020, 8, 26, 8, 0).getTime();
		entry.endTime = new Date(2020, 8, 26, 8, 30).getTime();

		const serviceProvider1 = ServiceProvider.create('Timmy', 1);
		serviceProvider1.id = 1;
		const serviceProvider2 = ServiceProvider.create('Andy', 1);
		serviceProvider2.id = 2;

		entry.addServiceProvider(serviceProvider1, {
			startTimeNative: entry.startTime,
			endTimeNative: entry.endTime,
			capacity: 1,
			title: 'Title Test - serviceProvider1',
			description: 'Description Test - serviceProvider1',
		} as TimeslotWithCapacity);
		entry.addServiceProvider(serviceProvider2, {
			startTimeNative: entry.startTime,
			endTimeNative: entry.endTime,
			capacity: 5,
			title: 'Title Test - serviceProvider2',
			description: 'Description Test - serviceProvider2',
		} as TimeslotWithCapacity);

		const timeslotServiceProviders = Array.from(entry.getTimeslotServiceProviders());
		UinFinConfigurationMock.canViewPlainUinFin.mockReturnValue(false);

		const mapper = Container.get(TimeslotsMapperV1);
		const response = mapper.mapCitizenTimeslotServiceProvidersV1(timeslotServiceProviders);

		expect(response.length).toBe(2);
		expect(response[1].eventTitle).toBe('Title Test - serviceProvider2');
		expect(response[0].eventTitle).toBe('Title Test - serviceProvider1');
		expect(response[0].eventDescription).toBe('Description Test - serviceProvider1');
		expect(response[1].eventDescription).toBe('Description Test - serviceProvider2');
	});
});

describe('Timeslots Mapper V2', () => {
	beforeAll(() => {
		Container.bind(IdHasher).to(IdHasherMock);
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	it('should map timeslot entry V2', async () => {
		const entry = new AvailableTimeslotProviders(new ServiceProvidersLookup());
		entry.startTime = new Date('2020-09-26T00:00:00.000Z').getTime();
		entry.endTime = new Date('2020-09-26T00:30:00.000Z').getTime();
		const spData = ServiceProvider.create('SP1', 1);
		spData.id = 1;
		entry.addServiceProvider(spData, {
			startTimeNative: entry.startTime,
			endTimeNative: entry.endTime,
			capacity: 1,
		} as TimeslotWithCapacity);

		IdHasherMock.encode.mockImplementation((id: number) => String(id));

		const mapper = Container.get(TimeslotsMapperV2);
		const res = await mapper.mapTimeslotEntryV2(entry);
		expect(res).toEqual({
			endTime: new Date('2020-09-26T00:30:00.000Z'),
			startTime: new Date('2020-09-26T00:00:00.000Z'),
			timeslotServiceProviders: [
				{
					acceptedBookings: [],
					assignedBookingCount: 0,
					availabilityCount: 1,
					capacity: 1,
					eventDescription: undefined,
					eventTitle: undefined,
					isRecurring: false,
					labels: [],
					pendingBookings: [],
					serviceProvider: { id: '1', name: 'SP1' },
				},
			],
			totalAssignedBookingCount: 0,
			totalAvailabilityCount: 1,
			totalCapacity: 1,
			totalUnassignedBookingCount: 0,
		});
	});

	it('should map availability V2', () => {
		const entry = new AvailableTimeslotProviders(new ServiceProvidersLookup());
		entry.startTime = new Date('2020-09-26T00:00:00.000Z').getTime();
		entry.endTime = new Date('2020-09-26T00:30:00.000Z').getTime();

		const spData = ServiceProvider.create('Timmy', 1);
		spData.id = 1;

		entry.addServiceProvider(spData, {
			startTimeNative: entry.startTime,
			endTimeNative: entry.endTime,
			capacity: 1,
		} as TimeslotWithCapacity);

		const mapper = Container.get(TimeslotsMapperV2);
		const res = mapper.mapAvailabilityToResponseV2([entry], {})[0];

		expect(res.availabilityCount).toBe(1);
		expect(res.startTime.toISOString()).toBe('2020-09-26T00:00:00.000Z');
		expect(res.endTime.toISOString()).toBe('2020-09-26T00:30:00.000Z');
	});

	it('should map service provider timeslot V2', async () => {
		const entry = new AvailableTimeslotProviders(new ServiceProvidersLookup());
		entry.startTime = new Date(2020, 8, 26, 8, 0).getTime();
		entry.endTime = new Date(2020, 8, 26, 8, 30).getTime();

		const serviceProvider1 = ServiceProvider.create('Timmy', 1);
		serviceProvider1.id = 1;
		const serviceProvider2 = ServiceProvider.create('Andy', 1);
		serviceProvider2.id = 2;

		entry.addServiceProvider(serviceProvider1, {
			startTimeNative: entry.startTime,
			endTimeNative: entry.endTime,
			capacity: 1,
		} as TimeslotWithCapacity);
		entry.addServiceProvider(serviceProvider2, {
			startTimeNative: entry.startTime,
			endTimeNative: entry.endTime,
			capacity: 5,
		} as TimeslotWithCapacity);

		const timeslotServiceProviders = Array.from(entry.getTimeslotServiceProviders());
		UinFinConfigurationMock.canViewPlainUinFin.mockReturnValue(false);

		const mapper = Container.get(TimeslotsMapperV2);
		const res = await mapper.mapTimeslotServiceProvidersV2(timeslotServiceProviders);

		const [spResponse, totalCapacity, totalBooked] = res;
		expect(spResponse.length).toBe(2);
		expect(spResponse[0].capacity).toBe(1);
		expect(spResponse[1].capacity).toBe(5);
		expect(totalCapacity).toBe(6);
		expect(totalBooked).toBe(0);
	});

	it('should map service provider timeslot title and description - admin side V2', async () => {
		const entry = new AvailableTimeslotProviders(new ServiceProvidersLookup());
		entry.startTime = new Date(2020, 8, 26, 8, 0).getTime();
		entry.endTime = new Date(2020, 8, 26, 8, 30).getTime();

		const serviceProvider1 = ServiceProvider.create('Timmy', 1);
		serviceProvider1.id = 1;
		const serviceProvider2 = ServiceProvider.create('Andy', 1);
		serviceProvider2.id = 2;

		entry.addServiceProvider(serviceProvider1, {
			startTimeNative: entry.startTime,
			endTimeNative: entry.endTime,
			capacity: 1,
			title: 'Title Test - serviceProvider1',
			description: 'Description Test - serviceProvider1',
		} as TimeslotWithCapacity);
		entry.addServiceProvider(serviceProvider2, {
			startTimeNative: entry.startTime,
			endTimeNative: entry.endTime,
			capacity: 5,
			title: 'Title Test - serviceProvider2',
			description: 'Description Test - serviceProvider2',
		} as TimeslotWithCapacity);

		const timeslotServiceProviders = Array.from(entry.getTimeslotServiceProviders());
		UinFinConfigurationMock.canViewPlainUinFin.mockReturnValue(false);

		const mapper = Container.get(TimeslotsMapperV2);
		const res = await mapper.mapTimeslotServiceProvidersV2(timeslotServiceProviders);

		const [spResponse] = res;
		expect(spResponse.length).toBe(2);
		expect(spResponse[0].eventTitle).toBe('Title Test - serviceProvider1');
		expect(spResponse[1].eventTitle).toBe('Title Test - serviceProvider2');
		expect(spResponse[0].eventDescription).toBe('Description Test - serviceProvider1');
		expect(spResponse[1].eventDescription).toBe('Description Test - serviceProvider2');
	});

	it('should map service provider timeslot title and description - citizen side V2', () => {
		const entry = new AvailableTimeslotProviders(new ServiceProvidersLookup());
		entry.startTime = new Date(2020, 8, 26, 8, 0).getTime();
		entry.endTime = new Date(2020, 8, 26, 8, 30).getTime();

		const serviceProvider1 = ServiceProvider.create('Timmy', 1);
		serviceProvider1.id = 1;
		const serviceProvider2 = ServiceProvider.create('Andy', 1);
		serviceProvider2.id = 2;

		entry.addServiceProvider(serviceProvider1, {
			startTimeNative: entry.startTime,
			endTimeNative: entry.endTime,
			capacity: 1,
			title: 'Title Test - serviceProvider1',
			description: 'Description Test - serviceProvider1',
		} as TimeslotWithCapacity);
		entry.addServiceProvider(serviceProvider2, {
			startTimeNative: entry.startTime,
			endTimeNative: entry.endTime,
			capacity: 5,
			title: 'Title Test - serviceProvider2',
			description: 'Description Test - serviceProvider2',
		} as TimeslotWithCapacity);

		const timeslotServiceProviders = Array.from(entry.getTimeslotServiceProviders());
		UinFinConfigurationMock.canViewPlainUinFin.mockReturnValue(false);

		const mapper = Container.get(TimeslotsMapperV2);
		const response = mapper.mapCitizenTimeslotServiceProvidersV2(timeslotServiceProviders);

		expect(response.length).toBe(2);
		expect(response[1].eventTitle).toBe('Title Test - serviceProvider2');
		expect(response[0].eventTitle).toBe('Title Test - serviceProvider1');
		expect(response[0].eventDescription).toBe('Description Test - serviceProvider1');
		expect(response[1].eventDescription).toBe('Description Test - serviceProvider2');
	});
});

describe('mapAvailabilityToDateResponse function', () => {
	it('should group availability to same date when the timeslots are the same day', () => {
		const entries = new Array<AvailableTimeslotProviders>();
		const svcId = 1;

		const entry1 = createAvailableTimeSlotProviderEntry(
			new Date(2020, 9, 27),
			new Date(2020, 9, 27, 0, 30),
			svcId,
			1,
			'Timmy',
			10,
		);

		entries.push(entry1);
		const entry2 = createAvailableTimeSlotProviderEntry(
			new Date(2020, 9, 27, 1),
			new Date(2020, 9, 27, 1, 30),
			svcId,
			1,
			'Jimmy',
			5,
		);

		entries.push(entry2);

		const mapper = Container.get(TimeslotsMapperV1);
		const res = mapper.groupAvailabilityByDateResponse(entries)[0];

		expect(res.totalAvailabilityCount).toBe(15);
		expect(res.date).toEqual(new Date(2020, 9, 27));
	});

	it('should group availability to individual date when the timeslots are on different days', () => {
		const entries = new Array<AvailableTimeslotProviders>();
		const svcId = 1;
		const entry1 = createAvailableTimeSlotProviderEntry(
			new Date(2020, 9, 27),
			new Date(2020, 9, 27, 0, 30),
			svcId,
			1,
			'Timmy',
			10,
		);

		entries.push(entry1);
		const entry2 = createAvailableTimeSlotProviderEntry(
			new Date(2020, 9, 28),
			new Date(2020, 9, 28, 0, 30),
			svcId,
			2,
			'Jimmy',
			5,
		);

		entries.push(entry2);

		const mapper = Container.get(TimeslotsMapperV1);
		const res = mapper.groupAvailabilityByDateResponse(entries);

		expect(res[0].totalAvailabilityCount).toBe(10);
		expect(res[0].date).toEqual(new Date(2020, 9, 27));

		expect(res[1].totalAvailabilityCount).toBe(5);
		expect(res[1].date).toEqual(new Date(2020, 9, 28));
	});

	it("should return availability as 0 when there's all available slots are booked", () => {
		const entries = new Array<AvailableTimeslotProviders>();
		const svcId = 1;
		const spId = 1;
		const startTime = new Date(2020, 9, 27);
		const endTime = new Date(2020, 9, 27, 0, 30);
		const entry1 = createAvailableTimeSlotProviderEntry(startTime, endTime, svcId, spId, 'Timmy', 1);

		const bookingBuilder = new BookingBuilder();
		bookingBuilder.serviceId = svcId;
		bookingBuilder.serviceProviderId = spId;
		bookingBuilder.startDateTime = startTime;
		bookingBuilder.endDateTime = endTime;
		entry1.setBookedServiceProviders([Booking.create(bookingBuilder)]);

		entries.push(entry1);

		const mapper = Container.get(TimeslotsMapperV1);
		const res = mapper.groupAvailabilityByDateResponse(entries);

		expect(res[0].totalAvailabilityCount).toBe(0);
		expect(res[0].date).toEqual(new Date(2020, 9, 27));
	});
});

function createAvailableTimeSlotProviderEntry(
	timeslotStartTime: Date,
	timeslotEndTime: Date,
	svcId: number,
	spId: number,
	spName: string,
	capacity: number,
): AvailableTimeslotProviders {
	const entry = new AvailableTimeslotProviders(new ServiceProvidersLookup());
	entry.startTime = timeslotStartTime.getTime();
	entry.endTime = timeslotEndTime.getTime();

	const spData = ServiceProvider.create(spName, svcId);
	spData.id = spId;

	entry.addServiceProvider(spData, {
		startTimeNative: entry.startTime,
		endTimeNative: entry.endTime,
		capacity,
	} as TimeslotWithCapacity);

	return entry;
}
