import { DateHelper } from '../dateHelper';
import { StopWatch } from '../stopWatch';
import { logger } from 'mol-lib-common';

jest.mock('mol-lib-common', () => {
	const decoratorMock = () => {
		return (target: any, key: string | symbol, descriptor: any) => descriptor;
	};

	const logger = {
		create: () => logger,
		setLoggerParams: jest.fn(),
		warn: jest.fn(),
		info: jest.fn(),
		debug: jest.fn(),
		error: jest.fn(),
		log: jest.fn(),
		fatal: jest.fn(),
	};
	return {
		MOLAuth: decoratorMock,
		logger,
		LoggerV2: logger,
	};
});

describe('date helper tests', () => {
	const originalDate = new Date(2020, 4, 27, 11, 30, 1, 1);
	const anotherDate = new Date(2020, 4, 27, 12, 15, 1, 1);

	it('should add minutes', () => {
		const result = DateHelper.addMinutes(originalDate, 30);

		expect(result.toLocaleDateString()).toBe(originalDate.toLocaleDateString());
		expect(result.getHours()).toBe(12);
		expect(result.getMinutes()).toBe(0);
		expect(result.getSeconds()).toBe(1);
		expect(result.getMilliseconds()).toBe(1);
		expect(result).not.toBe(originalDate); // immutable
	});

	it('should add hours', () => {
		const result = DateHelper.addHours(originalDate, 2);

		expect(result.toLocaleDateString()).toBe(originalDate.toLocaleDateString());
		expect(result.getHours()).toBe(13);
		expect(result.getMinutes()).toBe(30);
		expect(result.getSeconds()).toBe(1);
		expect(result.getMilliseconds()).toBe(1);
		expect(result).not.toBe(originalDate); // immutable
	});

	it('should add days', () => {
		const result = DateHelper.addDays(originalDate, 5);

		expect(result.getFullYear()).toBe(2020);
		expect(result.getMonth()).toBe(5); // Zero-based month
		expect(result.getDate()).toBe(1);

		expect(result.getHours()).toBe(11);
		expect(result.getMinutes()).toBe(30);
		expect(result.getSeconds()).toBe(1);
		expect(result.getMilliseconds()).toBe(1);
		expect(result).not.toBe(originalDate); // immutable
	});

	it('should get date only', () => {
		const result = DateHelper.getDateOnly(originalDate);

		expect(result.getFullYear()).toBe(2020);
		expect(result.getMonth()).toBe(4);
		expect(result.getDate()).toBe(27);

		expect(result.getHours()).toBe(0);
		expect(result.getMinutes()).toBe(0);
		expect(result.getSeconds()).toBe(0);
		expect(result.getMilliseconds()).toBe(0);
		expect(result).not.toBe(originalDate); // immutable
	});

	it('should get start of day', () => {
		const result = DateHelper.getStartOfDay(originalDate);

		expect(result.getFullYear()).toBe(2020);
		expect(result.getMonth()).toBe(4);
		expect(result.getDate()).toBe(27);

		expect(result.getHours()).toBe(0);
		expect(result.getMinutes()).toBe(0);
		expect(result.getSeconds()).toBe(0);
		expect(result.getMilliseconds()).toBe(0);
		expect(result).not.toBe(originalDate); // immutable
	});

	it('should get end of day', () => {
		const result = DateHelper.getEndOfDay(originalDate);

		expect(result.getFullYear()).toBe(2020);
		expect(result.getMonth()).toBe(4);
		expect(result.getDate()).toBe(27);

		expect(result.getHours()).toBe(23);
		expect(result.getMinutes()).toBe(59);
		expect(result.getSeconds()).toBe(59);
		expect(result.getMilliseconds()).toBe(999);
		expect(result).not.toBe(originalDate); // immutable
	});

	it('should get diff in minutes', () => {
		const result = DateHelper.DiffInMinutes(anotherDate, originalDate);
		expect(result).toBe(45);
	});

	it('should get diff in seconds', () => {
		const result = DateHelper.DiffInSeconds(anotherDate, originalDate);
		expect(result).toBe(45 * 60);
	});

	it('should get diff in days', () => {
		const result = DateHelper.DiffInDays(anotherDate, originalDate);
		expect(result.toFixed(5)).toBe('0.03125');

		const resultInverse = DateHelper.DiffInDays(originalDate, anotherDate);
		expect(resultInverse.toFixed(5)).toBe('-0.03125');
	});

	it('should compare equal date and time', () => {
		const instance = new Date(2020, 4, 27, 11, 30, 1, 1);
		expect(DateHelper.equals(originalDate, instance)).toBe(true);
		expect(instance).not.toBe(originalDate);
	});

	it('should compare equal date only', () => {
		const instance = new Date(2020, 4, 27, 12, 30);
		expect(DateHelper.equalsDateOnly(originalDate, instance)).toBe(true);
	});

	it('should set hours', () => {
		const result = DateHelper.setHours(originalDate, 14, 15);

		expect(result.toLocaleDateString()).toBe(originalDate.toLocaleDateString());
		expect(result.getHours()).toBe(14);
		expect(result.getMinutes()).toBe(15);
		expect(result.getSeconds()).toBe(0);
		expect(result.getMilliseconds()).toBe(0);
		expect(result).not.toBe(originalDate); // immutable
	});

	it('should get time string', () => {
		const instance = new Date(2020, 4, 27, 5, 6, 1, 1);
		const result = DateHelper.getTimeString(instance);

		expect(result).toBe('05:06');
	});

	it('should get UTC as if it was local', () => {
		const instance = new Date(Date.UTC(2020, 4, 27, 11, 30, 1, 1));
		const result = DateHelper.UTCAsLocal(instance);

		expect(result.getFullYear()).toBe(2020);
		expect(result.getMonth()).toBe(4);
		expect(result.getDate()).toBe(27);

		expect(result.getHours()).toBe(11);
		expect(result.getMinutes()).toBe(30);
		expect(result.getSeconds()).toBe(1);
		expect(result.getMilliseconds()).toBe(1);
		expect(result).not.toBe(instance); // immutable
	});

	it('should format date to 12h time', () => {
		let result = DateHelper.getTime12hFormatString(originalDate);
		expect(result).toBe('11:30am');
		result = DateHelper.getTime12hFormatString(new Date(2020, 4, 27, 0, 30, 1, 1));
		expect(result).toBe('12:30am');
		result = DateHelper.getTime12hFormatString(new Date(2020, 4, 27, 0, 0, 0, 0));
		expect(result).toBe('12:00am');
		result = DateHelper.getTime12hFormatString(new Date(2020, 4, 27, 12, 0, 0, 0));
		expect(result).toBe('12:00pm');
	});

	it('should format date dd/mm/yyyy', () => {
		const result = DateHelper.getDateFormat(originalDate);
		expect(result).toBe('27 May 2020');
	});

	it('should get start of day native', () => {
		const now = new Date();
		for (let hour = 0; hour <= 48; hour++) {
			const time = DateHelper.addHours(now, hour);
			const start = DateHelper.getStartOfDay(time);
			const startNative = DateHelper.getStartOfDayNative(time.getTime());
			expect(start.getTime()).toEqual(startNative);
		}
	});

	it('should get end of day native', () => {
		const now = new Date();
		for (let hour = 0; hour <= 48; hour++) {
			const time = DateHelper.addHours(now, hour);
			const end = DateHelper.getEndOfDay(time);
			const endNative = DateHelper.getEndOfDayNative(time.getTime());
			expect(end.getTime()).toEqual(endNative);
		}
	});

	it('[perf] should get start of day native', () => {
		(logger.info as jest.Mock).mockImplementation((msg, obj) => {
			console.log(msg, obj);
		});

		const now = new Date();
		const stopWatch1 = new StopWatch('StartOfDay');
		for (let i = 0; i <= 500000; i++) {
			DateHelper.getStartOfDay(now);
		}
		stopWatch1.stop();

		const stopWatch2 = new StopWatch('StartOfDayNative');
		for (let i = 0; i <= 500000; i++) {
			DateHelper.getStartOfDayNative(now.getTime());
		}

		stopWatch2.stop();
	});

	it('[perf] should get end of day native', () => {
		(logger.info as jest.Mock).mockImplementation((msg, obj) => {
			console.log(msg, obj);
		});

		const now = new Date();
		const stopWatch1 = new StopWatch('EndOfDay');
		for (let i = 0; i <= 500000; i++) {
			DateHelper.getEndOfDay(now);
		}
		stopWatch1.stop();

		const stopWatch2 = new StopWatch('EndOfDayNative');
		for (let i = 0; i <= 500000; i++) {
			DateHelper.getEndOfDayNative(now.getTime());
		}

		stopWatch2.stop();
	});
});
