import { tryParseInt } from '../number';

describe('number tests', () => {
	it('should parse number', () => {
		expect(tryParseInt('0')).toBe(0);
		expect(tryParseInt('1')).toBe(1);
		expect(tryParseInt('100')).toBe(100);
		expect(tryParseInt(2 as any)).toBe(2);
	});

	it('should parse number (when is a number already)', () => {
		expect(tryParseInt(2 as any)).toBe(2);
	});

	it('should NOT parse number', () => {
		expect(tryParseInt('')).toBe(undefined);
		expect(tryParseInt('abc')).toBe(undefined);
		expect(tryParseInt(undefined)).toBe(undefined);
		expect(tryParseInt(null)).toBe(undefined);
	});
});
