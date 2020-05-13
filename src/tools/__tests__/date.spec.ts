import { diffHours, isValidFormatHHmm } from "../date";

describe("Test dates", () => {
	it("Should have a valid format time", () => {
		expect(isValidFormatHHmm("33:12")).toBe(false);
		expect(isValidFormatHHmm("03:62")).toBe(false);
		expect(isValidFormatHHmm("0362")).toBe(false);
		expect(isValidFormatHHmm("3:12")).toBe(true);
		expect(isValidFormatHHmm("03:12")).toBe(true);
	});

	it("Should calcule diff between two hours", () => {
		expect(diffHours("21:12", "22:12")).toBe(60);
		expect(diffHours("22:12", "22:12")).toBe(0);
		expect(diffHours("23:12", "22:12")).toBe(-60);
	});
});