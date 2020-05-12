
import { Timeslot } from '../../models/templateTimeslots';
import { TimeslotAggregator } from '../timeslotAggregator';
import { DateHelper } from '../../infrastructure/dateHelper';

describe('Timeslot aggregator', () => {
	it('should aggregate timeslots in order', () => {
		const date = new Date(Date.parse('2020-01-01'));
		const group1 = [
			new Timeslot(DateHelper.setHours(date, 8, 0), DateHelper.setHours(date, 9, 0)),
			new Timeslot(DateHelper.setHours(date, 10, 0), DateHelper.setHours(date, 11, 0))
		];

		const group2 = [
			new Timeslot(DateHelper.setHours(date, 9, 0), DateHelper.setHours(date, 10, 0)),
			new Timeslot(DateHelper.setHours(date, 10, 0), DateHelper.setHours(date, 11, 0)),
			new Timeslot(DateHelper.setHours(date, 8, 0), DateHelper.setHours(date, 9, 0))
		];

		const group3 = [
			new Timeslot(DateHelper.setHours(date, 10, 0), DateHelper.setHours(date, 11, 0)),
			new Timeslot(DateHelper.setHours(date, 8, 0), DateHelper.setHours(date, 8, 30)),
			new Timeslot(DateHelper.setHours(date, 8, 30), DateHelper.setHours(date, 9, 30))
		];

		const aggregator = new TimeslotAggregator<string>();
		aggregator.aggregate('A', group1);
		aggregator.aggregate('B', group2);
		aggregator.aggregate('C', group3);

		const entries = aggregator.getEntries();
		aggregator.clear();

		expect(entries.length).toBe(5);
		expect(DateHelper.getTimeString(entries[0].getTimeslot().getStartTime())).toBe("08:00");
		expect(DateHelper.getTimeString(entries[0].getTimeslot().getEndTime())).toBe("08:30");

		expect(DateHelper.getTimeString(entries[1].getTimeslot().getStartTime())).toBe("08:00");
		expect(DateHelper.getTimeString(entries[1].getTimeslot().getEndTime())).toBe("09:00");

		expect(DateHelper.getTimeString(entries[2].getTimeslot().getStartTime())).toBe("08:30");
		expect(DateHelper.getTimeString(entries[3].getTimeslot().getStartTime())).toBe("09:00");
		expect(DateHelper.getTimeString(entries[4].getTimeslot().getStartTime())).toBe("10:00");

		expect(entries[0].getGroupIds().join(',')).toBe("C");
		expect(entries[1].getGroupIds().join(',')).toBe("A,B");
		expect(entries[2].getGroupIds().join(',')).toBe("C");
		expect(entries[3].getGroupIds().join(',')).toBe("B");
		expect(entries[4].getGroupIds().join(',')).toBe("A,B,C");
	});
});
