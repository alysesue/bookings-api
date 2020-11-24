import { AggregatedEntryId, compareEntryFn, generateTimeslotKey, TimeslotAggregator } from '../timeslotAggregator';
import { DateHelper } from '../../../infrastructure/dateHelper';
import { TimeslotWithCapacity } from '../../../models/timeslotWithCapacity';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

describe('Timeslot aggregator', () => {
	it('should generate timeslots key', () => {
		const key = generateTimeslotKey(new Date(2), new Date(3));
		const expected = BigInt(2) * BigInt(Math.pow(2, 48)) + BigInt(3);
		expect(key).toBe(expected);
	});

	it('should aggregate timeslots in order', () => {
		const date = new Date(Date.parse('2020-01-01'));
		const group1 = [
			new TimeslotWithCapacity(DateHelper.setHours(date, 8, 0), DateHelper.setHours(date, 9, 0)),
			new TimeslotWithCapacity(DateHelper.setHours(date, 10, 0), DateHelper.setHours(date, 11, 0)),
		];

		const group2 = [
			new TimeslotWithCapacity(DateHelper.setHours(date, 9, 0), DateHelper.setHours(date, 10, 0)),
			new TimeslotWithCapacity(DateHelper.setHours(date, 10, 0), DateHelper.setHours(date, 11, 0)),
			new TimeslotWithCapacity(DateHelper.setHours(date, 8, 0), DateHelper.setHours(date, 9, 0)),
		];

		const group3 = [
			new TimeslotWithCapacity(DateHelper.setHours(date, 10, 0), DateHelper.setHours(date, 11, 0)),
			new TimeslotWithCapacity(DateHelper.setHours(date, 8, 0), DateHelper.setHours(date, 8, 30)),
			new TimeslotWithCapacity(DateHelper.setHours(date, 8, 30), DateHelper.setHours(date, 9, 30)),
		];

		const aggregator = TimeslotAggregator.create<string>();
		aggregator.aggregate('A', group1);
		aggregator.aggregate('B', group2);
		aggregator.aggregate('C', group3);

		const entries = Array.from(aggregator.getEntries().values());
		entries.sort(compareEntryFn);

		expect(entries.length).toBe(5);
		expect(DateHelper.getTimeString(entries[0].getTimeslot().getStartTime())).toBe('08:00');
		expect(DateHelper.getTimeString(entries[0].getTimeslot().getEndTime())).toBe('08:30');

		expect(DateHelper.getTimeString(entries[1].getTimeslot().getStartTime())).toBe('08:00');
		expect(DateHelper.getTimeString(entries[1].getTimeslot().getEndTime())).toBe('09:00');

		expect(DateHelper.getTimeString(entries[2].getTimeslot().getStartTime())).toBe('08:30');
		expect(DateHelper.getTimeString(entries[3].getTimeslot().getStartTime())).toBe('09:00');
		expect(DateHelper.getTimeString(entries[4].getTimeslot().getStartTime())).toBe('10:00');

		expect(Array.from(entries[0].getGroups().keys()).join(', ')).toBe('C');
		expect(Array.from(entries[1].getGroups().keys()).join(',')).toBe('A,B');
		expect(Array.from(entries[2].getGroups().keys()).join(',')).toBe('C');
		expect(Array.from(entries[3].getGroups().keys()).join(',')).toBe('B');
		expect(Array.from(entries[4].getGroups().keys()).join(',')).toBe('A,B,C');
	});

	it('should aggregate by unique id', () => {
		type MyType = { id: number; value: string };

		const date = new Date(Date.parse('2020-01-01'));
		const group1 = [
			new TimeslotWithCapacity(DateHelper.setHours(date, 8, 0), DateHelper.setHours(date, 9, 0)),
			new TimeslotWithCapacity(DateHelper.setHours(date, 10, 0), DateHelper.setHours(date, 11, 0)),
		];

		const group2 = [
			new TimeslotWithCapacity(DateHelper.setHours(date, 9, 0), DateHelper.setHours(date, 10, 0)),
			new TimeslotWithCapacity(DateHelper.setHours(date, 10, 0), DateHelper.setHours(date, 11, 0)),
			new TimeslotWithCapacity(DateHelper.setHours(date, 8, 0), DateHelper.setHours(date, 9, 0)),
		];

		const group3 = [
			new TimeslotWithCapacity(DateHelper.setHours(date, 10, 0), DateHelper.setHours(date, 11, 0)),
			new TimeslotWithCapacity(DateHelper.setHours(date, 8, 0), DateHelper.setHours(date, 8, 30)),
			new TimeslotWithCapacity(DateHelper.setHours(date, 8, 30), DateHelper.setHours(date, 9, 30)),
		];

		const aggregator = TimeslotAggregator.createCustom<MyType, AggregatedEntryId<MyType>>(AggregatedEntryId);
		aggregator.aggregate({ id: 10, value: 'A' }, group1);
		aggregator.aggregate({ id: 10, value: 'A2' }, group2);
		aggregator.aggregate({ id: 20, value: 'C' }, group3);

		const entries = Array.from(aggregator.getEntries().values());
		entries.sort(compareEntryFn);

		expect(entries.length).toBe(5);
		expect(DateHelper.getTimeString(entries[0].getTimeslot().getStartTime())).toBe('08:00');
		expect(DateHelper.getTimeString(entries[0].getTimeslot().getEndTime())).toBe('08:30');

		expect(DateHelper.getTimeString(entries[1].getTimeslot().getStartTime())).toBe('08:00');
		expect(DateHelper.getTimeString(entries[1].getTimeslot().getEndTime())).toBe('09:00');

		expect(DateHelper.getTimeString(entries[2].getTimeslot().getStartTime())).toBe('08:30');
		expect(DateHelper.getTimeString(entries[3].getTimeslot().getStartTime())).toBe('09:00');
		expect(DateHelper.getTimeString(entries[4].getTimeslot().getStartTime())).toBe('10:00');

		expect(
			Array.from(entries[0].getGroups().keys())
				.map((k) => k.value)
				.join(', '),
		).toBe('C');
		expect(
			Array.from(entries[1].getGroups().keys())
				.map((k) => k.value)
				.join(','),
		).toBe('A');
		expect(
			Array.from(entries[2].getGroups().keys())
				.map((k) => k.value)
				.join(','),
		).toBe('C');
		expect(
			Array.from(entries[3].getGroups().keys())
				.map((k) => k.value)
				.join(','),
		).toBe('A2');
		expect(
			Array.from(entries[4].getGroups().keys())
				.map((k) => k.value)
				.join(','),
		).toBe('A,C');
	});
});
