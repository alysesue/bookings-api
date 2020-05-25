import { diffHours, isValidFormatHHmm, parseHHmm } from "../date";
import { parse } from "querystring";

describe("Test dates", () => {
	it("Should have a valid format time", () => {
		expect(isValidFormatHHmm("33:12")).toBe(false);
		expect(isValidFormatHHmm("03:62")).toBe(false);
		expect(isValidFormatHHmm("0362")).toBe(false);
		expect(isValidFormatHHmm("3:12")).toBe(true);
		expect(isValidFormatHHmm("03:12")).toBe(true);
		expect(isValidFormatHHmm("2323")).toBe(false);
	});

	it("Should calcule diff between two hours", () => {
		expect(diffHours("21:12", "22:12")).toBe(60);
		expect(diffHours("22:12", "22:12")).toBe(0);
		expect(diffHours("23:12", "22:12")).toBe(-60);
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
		}
		catch (e) {
			expect(e.message).toMatch('Value 1630 is not a valid time.');
		}

	});
});
