import { TimeslotServiceProvider } from '../../../models/timeslotServiceProvider';
import { AvailableTimeslotProviders } from '../availableTimeslotProviders';
import { ServiceProvider, TimeOfDay, TimeslotItem, TimeslotsSchedule } from '../../../models';
import { TimeslotsMapper } from '../timeslots.mapper';
import { TimeslotWithCapacity } from '../../../models/timeslotWithCapacity';
import { DateHelper } from '../../../infrastructure/dateHelper';
import { Service } from 'mol-lib-api-contract';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});
afterEach(() => {
	jest.resetAllMocks();
});

describe('Timeslots Mapper', () => {
	it('should map availability', () => {
		const entry = new AvailableTimeslotProviders();
		entry.startTime = new Date('2020-09-26T00:00:00.000Z');
		entry.endTime = new Date('2020-09-26T00:30:00.000Z');

		const spData = ServiceProvider.create('Timmy', 1);
		spData.id = 1;
		const map = new Map<ServiceProvider, TimeslotWithCapacity>();
		map.set(spData, new TimeslotWithCapacity(entry.startTime, entry.endTime, 1));

		entry.setRelatedServiceProviders(map);

		const res = TimeslotsMapper.mapAvailabilityToResponse([entry])[0];

		expect(res.availabilityCount).toBe(1);
		expect(res.startTime.toISOString()).toBe('2020-09-26T00:00:00.000Z');
		expect(res.endTime.toISOString()).toBe('2020-09-26T00:30:00.000Z');
	});

	it('should map service provider timeslot', () => {
		const entry = new AvailableTimeslotProviders();
		entry.startTime = new Date(2020, 8, 26, 8, 0);
		entry.endTime = new Date(2020, 8, 26, 8, 30);

		const serviceProvider1 = ServiceProvider.create('Timmy', 1);
		serviceProvider1.id = 1;
		const serviceProvider2 = ServiceProvider.create('Andy', 1);
		serviceProvider2.id = 2;

		const map = new Map<ServiceProvider, TimeslotWithCapacity>();
		map.set(serviceProvider1, new TimeslotWithCapacity(entry.startTime, entry.endTime, 1));
		map.set(serviceProvider2, new TimeslotWithCapacity(entry.startTime, entry.endTime, 5));
		entry.setRelatedServiceProviders(map);

		const timeslotServiceProviders = Array.from(entry.getTimeslotServiceProviders());
		const res = TimeslotsMapper.mapTimeslotServiceProviders(timeslotServiceProviders);
		const [spResponse, totalCapacity, totalBooked] = res;
		expect(spResponse.length).toBe(2);
		expect(spResponse[0].capacity).toBe(1);
		expect(spResponse[1].capacity).toBe(5);
		expect(totalCapacity).toBe(6);
		expect(totalBooked).toBe(0);
	});
});
