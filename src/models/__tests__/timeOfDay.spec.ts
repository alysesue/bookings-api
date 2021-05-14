import { range } from 'lodash';
import { StopWatch } from '../../infrastructure/stopWatch';
import { TimeOfDay, Transformer } from '../timeOfDay';

describe('Time of day tests', () => {
	const padStart = (n: number) => n.toString().padStart(2, '0');

	it('should parse time of day', () => {
		const timeA = TimeOfDay.parse('08:30');
		expect(timeA.hours).toBe(8);
		expect(timeA.minutes).toBe(30);
	});

	it('should parse time of day [2]', () => {
		const timeA = TimeOfDay.parse('08:30:00');
		expect(timeA.hours).toBe(8);
		expect(timeA.minutes).toBe(30);
	});

	it('should parse time of day [3]', () => {
		const timeA = TimeOfDay.parse('08:30:20');
		expect(timeA.hours).toBe(8);
		expect(timeA.minutes).toBe(30);
	});


	it('should parse time of day [perf]', () => {
		const allTimes: string[] = [];
		const watchTestData = new StopWatch('Test data');
		for (const hour of range(0, 23)) {
			for (const minute of range(0, 59)) {
				for (const second of range(0, 59)) {
					allTimes.push(`${padStart(hour)}:${padStart(minute)}:${padStart(second)}`);
				}
			}
		}
		watchTestData.stop();

		const watchParse = new StopWatch('Parse fist time');
		let parsed: TimeOfDay;
		for(const time of allTimes){
			parsed = TimeOfDay.parse(time);
			parsed.AsMilliseconds();
			parsed.AsMinutes();
		}
		watchParse.stop();

		const watchParseSecond = new StopWatch('Parse second time');
		for(const time of allTimes){
			parsed = TimeOfDay.parse(time);
			parsed.AsMilliseconds();
			parsed.AsMinutes();
		}
		watchParseSecond.stop();
	});

	it('should create time of day [perf]', () => {
		const allTimes: TimeOfDay[] = [];
		const watchTestData = new StopWatch('create time');
		const max = 24*60*60;
		for (let i = 0; i < max; i++) {
			allTimes.push(TimeOfDay.create({hours: 8, minutes: 30}));
		}
		watchTestData.stop();

		expect(allTimes.length).toEqual(max);
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

	it('should convert to milliseconds', () => {
		const time = TimeOfDay.parse('01:20');
		const milliseconds = time.AsMilliseconds();

		expect(milliseconds).toBe(4800000);
	});

	it('should calculate diff in minutes', () => {
		const timeA = TimeOfDay.parse('08:30');
		const timeB = TimeOfDay.parse('09:01');

		const diff = TimeOfDay.DiffInMinutes(timeB, timeA);
		const diffInverse = TimeOfDay.DiffInMinutes(timeA, timeB);

		expect(diff).toBe(31);
		expect(diffInverse).toBe(-31);
	});

	it('should add minutes', () => {
		let timeOfDay = TimeOfDay.parse('11:30');
		let res = timeOfDay.addMinutes(30);
		expect(res.toString()).toBe('12:00');
		timeOfDay = TimeOfDay.parse('23:30');
		res = timeOfDay.addMinutes(30);
		expect(res.toString()).toBe('00:00');
	});

	it('should create TimeOfDay with minutes', () => {
		const timeOfDay = TimeOfDay.minutesToTimeOfDay(125);
		expect(timeOfDay.toString()).toBe('02:05');
		expect(() => TimeOfDay.minutesToTimeOfDay(-125)).toThrow('Invalid hours value: -2');
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
