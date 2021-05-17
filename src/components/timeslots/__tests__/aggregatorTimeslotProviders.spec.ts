import { DateHelper } from '../../../infrastructure/dateHelper';
import { TimeslotWithCapacity } from '../../../models/timeslotWithCapacity';
import { AggregatorTimeslotProviders, ServiceProvidersLookup } from '../aggregatorTimeslotProviders';
import { ServiceProvider } from '../../../models';
import { AvailableTimeslotProviders } from '../availableTimeslotProviders';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

const createTimeslot = (startTime: Date, endTime: Date, capacity?: number) => {
	return {
		startTimeNative: startTime.getTime(),
		endTimeNative: endTime.getTime(),
		capacity: capacity || 1,
	} as TimeslotWithCapacity;
};

export const compareEntry = (a: AvailableTimeslotProviders, b: AvailableTimeslotProviders): number => {
	const diffStart = a.startTime - b.startTime;
	if (diffStart !== 0) return diffStart;

	return a.endTime - b.endTime;
};

describe('AggregatorTimeslotProviders tests', () => {
	it('should aggregate timeslots', async () => {
		const date = new Date(Date.parse('2020-01-01'));
		const group1 = [
			createTimeslot(DateHelper.setHours(date, 8, 0), DateHelper.setHours(date, 9, 0)),
			createTimeslot(DateHelper.setHours(date, 10, 0), DateHelper.setHours(date, 11, 0)),
		];

		const group2 = [
			createTimeslot(DateHelper.setHours(date, 9, 0), DateHelper.setHours(date, 10, 0)),
			createTimeslot(DateHelper.setHours(date, 10, 0), DateHelper.setHours(date, 11, 0)),
			createTimeslot(DateHelper.setHours(date, 8, 0), DateHelper.setHours(date, 9, 0)),
		];

		const group3 = [
			createTimeslot(DateHelper.setHours(date, 10, 0), DateHelper.setHours(date, 11, 0)),
			createTimeslot(DateHelper.setHours(date, 8, 0), DateHelper.setHours(date, 8, 30)),
			createTimeslot(DateHelper.setHours(date, 8, 30), DateHelper.setHours(date, 9, 30)),
		];

		const lookup = new ServiceProvidersLookup();
		const aggregator = new AggregatorTimeslotProviders(lookup);

		const spA = ServiceProvider.create('A', 1);
		spA.id = 1;
		const spB = ServiceProvider.create('B', 1);
		spB.id = 2;
		const spC = ServiceProvider.create('C', 1);
		spC.id = 3;

		await aggregator.aggregate(spA, group1);
		await aggregator.aggregate(spB, group2);
		await aggregator.aggregate(spC, group3);

		const entries = Array.from(aggregator.getEntries().values());
		entries.sort(compareEntry);

		expect(entries.length).toBe(5);
		expect(DateHelper.getTimeString(new Date(entries[0].startTime))).toBe('08:00');
		expect(DateHelper.getTimeString(new Date(entries[0].endTime))).toBe('08:30');

		expect(DateHelper.getTimeString(new Date(entries[1].startTime))).toBe('08:00');
		expect(DateHelper.getTimeString(new Date(entries[1].endTime))).toBe('09:00');

		expect(DateHelper.getTimeString(new Date(entries[2].startTime))).toBe('08:30');
		expect(DateHelper.getTimeString(new Date(entries[3].startTime))).toBe('09:00');
		expect(DateHelper.getTimeString(new Date(entries[4].startTime))).toBe('10:00');

		const getNames = (entry: AvailableTimeslotProviders) => {
			return Array.from(entry.getServiceProviders())
				.map((s) => s.name)
				.join(',');
		};

		expect(getNames(entries[0])).toBe('C');
		expect(getNames(entries[1])).toBe('A,B');
		expect(getNames(entries[2])).toBe('C');
		expect(getNames(entries[3])).toBe('B');
		expect(getNames(entries[4])).toBe('A,B,C');
	});

	it('should not duplicate Sp record with same ID in lookup', async () => {
		const date = new Date(Date.parse('2020-01-01'));
		const group1 = [
			createTimeslot(DateHelper.setHours(date, 8, 0), DateHelper.setHours(date, 9, 0)),
			createTimeslot(DateHelper.setHours(date, 10, 0), DateHelper.setHours(date, 11, 0)),
		];

		const lookup = new ServiceProvidersLookup();
		const aggregator = new AggregatorTimeslotProviders(lookup);

		const spA = ServiceProvider.create('A', 1);
		spA.id = 1;
		const spA2 = ServiceProvider.create('A2', 1);
		spA2.id = 1;

		await aggregator.aggregate(spA, group1);
		await aggregator.aggregate(spA2, group1);

		const entries = Array.from(aggregator.getEntries().values());
		entries.sort(compareEntry);

		expect(Array.from(lookup.getAll()).length).toBe(1);
		expect(entries.length).toBe(2);
	});
});
