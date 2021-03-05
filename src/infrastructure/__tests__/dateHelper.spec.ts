import { DateHelper } from '../dateHelper';

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
});
