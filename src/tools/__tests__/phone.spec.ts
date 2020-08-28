import { validatePhoneNumber } from "../phone";

describe("Test phone rules", () => {
	it('Validate phone number', () => {
		expect(validatePhoneNumber('')).toBeFalsy();
		expect(validatePhoneNumber('+33 6666 6666')).toBeTruthy();
		expect(validatePhoneNumber('+3366666666')).toBeTruthy();
		expect(validatePhoneNumber('+336666666')).toBeFalsy();
	});
});