import { isValidFormatHHmm, parseHHmm } from "../date";

describe("Test dates", () => {
	it("Should have a valid format time", () => {
		expect(isValidFormatHHmm("33:12")).toBe(false);
		expect(isValidFormatHHmm("03:62")).toBe(false);
		expect(isValidFormatHHmm("0362")).toBe(false);
		expect(isValidFormatHHmm("3:12")).toBe(true);
		expect(isValidFormatHHmm("03:12")).toBe(true);
		expect(isValidFormatHHmm("2323")).toBe(false);
	});

	it("Should return hours and minutes", () => {
		const parsed = parseHHmm("16:30");

		expect(parsed).toBeDefined();
		expect(parsed.hours).toBe(16);
		expect(parsed.minutes).toBe(30);
		// tslint:disable-next-line:no-unused-expression
		expect(parseHHmm(null)).toBeNull;
		// tslint:disable-next-line:no-unused-expression
		expect(parseHHmm(undefined)).toBeNull;
		try {
			parseHHmm("1630");
		} catch (e) {
			expect(e.message).toMatch('Value 1630 is not a valid time.');
		}

	});

	it("Should not parse null value", () => {
		const parsedNull = parseHHmm(null);
		const parsedUndefined = parseHHmm(undefined);

		expect(parsedNull).toBe(null);
		expect(parsedUndefined).toBe(null);
	});

	it("Should parse with error when format is invalid.", () => {
		expect(() => {
			parseHHmm("0362");
		}).toThrowError();
	});
});
