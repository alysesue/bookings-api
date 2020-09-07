import { TimeOfDay, Transformer } from '../timeOfDay';

describe('Time of day tests', () => {
	it('should parse time of day', () => {
		const timeA = TimeOfDay.parse('08:30');
		expect(timeA.hours).toBe(8);
		expect(timeA.minutes).toBe(30);
	});

	it('should not parse null time', () => {
		const timeA = TimeOfDay.parse(null);
		const timeB = TimeOfDay.create(null);
		expect(timeA).toBe(null);
		expect(timeB).toBe(null);
	});

	it('should get time from date', () => {
		const date = new Date(2020, 4, 27, 11, 30);
		const timeA = TimeOfDay.fromDate(date);
		const timeB = TimeOfDay.fromDate(null);

		expect(timeA).toBeDefined();
		expect(timeA.hours).toBe(11);
		expect(timeA.minutes).toBe(30);
		expect(timeB).toBe(null);
	});

	it('should convert time to string', () => {
		const time = TimeOfDay.parse('8:3');
		const str = time.toString();
		const json = time.toJSON();

		expect(str).toBe('08:03');
		expect(json).toBe('08:03');
	});

	it('should use time of day', () => {
		const date = new Date(2020, 4, 27, 11, 30, 1, 1);
		const time = TimeOfDay.parse('08:30');

		const anotherDate = time.useTimeOfDay(date);
		expect(anotherDate.getHours()).toBe(8);
		expect(anotherDate.getMinutes()).toBe(30);
		expect(anotherDate.getSeconds()).toBe(0);
		expect(anotherDate.getMilliseconds()).toBe(0);
	});

	it('should convert to minutes', () => {
		const time = TimeOfDay.parse('01:20');
		const minutes = time.AsMinutes();

		expect(minutes).toBe(80);
	});

	it('should calculate diff in minutes', () => {
		const timeA = TimeOfDay.parse('08:30');
		const timeB = TimeOfDay.parse('09:01');

		const diff = TimeOfDay.DiffInMinutes(timeB, timeA);
		const diffInverse = TimeOfDay.DiffInMinutes(timeA, timeB);

		expect(diff).toBe(31);
		expect(diffInverse).toBe(-31);
	});

	it('should throw on invalid time of day', () => {
		expect(() => {
			TimeOfDay.create({ hours: -1, minutes: 0 });
		}).toThrowError();

		expect(() => {
			TimeOfDay.create({ hours: 0, minutes: -1 });
		}).toThrowError();

		expect(() => {
			TimeOfDay.create({ hours: 24, minutes: 0 });
		}).toThrowError();

		expect(() => {
			TimeOfDay.create({ hours: 0, minutes: 60 });
		}).toThrowError();
	});

	it('should transfrom from raw value', () => {
		const timeA = Transformer.from('08:30:00');
		expect(timeA.hours).toBe(8);
		expect(timeA.minutes).toBe(30);
	});

	it('should transfrom to raw value', () => {
		const timeB = TimeOfDay.create({ hours: 11, minutes: 30 });
		const raw = Transformer.to(timeB);
		const rawNull = Transformer.to(null);

		expect(raw).toBe('11:30');
		expect(rawNull).toBe(null);
	});
});
