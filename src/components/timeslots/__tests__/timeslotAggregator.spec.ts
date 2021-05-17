import { compareEntryFn, generateTimeslotKey, TimeslotAggregator } from '../timeslotAggregator';
import { DateHelper } from '../../../infrastructure/dateHelper';
import { TimeslotWithCapacity } from '../../../models/timeslotWithCapacity';

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

describe('Timeslot aggregator', () => {
	it('should generate timeslots key', () => {
		const key = generateTimeslotKey(new Date(2000000000000), new Date(3000000000000));
		expect(key).toBe('2000000000000|3000000000000');
	});

	it('should aggregate timeslots in order', async () => {
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

		const aggregator = TimeslotAggregator.create<string>();
		await aggregator.aggregate('A', group1);
		await aggregator.aggregate('B', group2);
		await aggregator.aggregate('C', group3);

		const entries = Array.from(aggregator.getEntries().values());
		entries.sort(compareEntryFn);

		expect(entries.length).toBe(5);
		expect(DateHelper.getTimeString(new Date(entries[0].getTimeslot().startTimeNative))).toBe('08:00');
		expect(DateHelper.getTimeString(new Date(entries[0].getTimeslot().endTimeNative))).toBe('08:30');

		expect(DateHelper.getTimeString(new Date(entries[1].getTimeslot().startTimeNative))).toBe('08:00');
		expect(DateHelper.getTimeString(new Date(entries[1].getTimeslot().endTimeNative))).toBe('09:00');

		expect(DateHelper.getTimeString(new Date(entries[2].getTimeslot().startTimeNative))).toBe('08:30');
		expect(DateHelper.getTimeString(new Date(entries[3].getTimeslot().startTimeNative))).toBe('09:00');
		expect(DateHelper.getTimeString(new Date(entries[4].getTimeslot().startTimeNative))).toBe('10:00');

		expect(Array.from(entries[0].getGroups().keys()).join(',')).toBe('C');
		expect(Array.from(entries[1].getGroups().keys()).join(',')).toBe('A,B');
		expect(Array.from(entries[2].getGroups().keys()).join(',')).toBe('C');
		expect(Array.from(entries[3].getGroups().keys()).join(',')).toBe('B');
		expect(Array.from(entries[4].getGroups().keys()).join(',')).toBe('A,B,C');
	});
});
