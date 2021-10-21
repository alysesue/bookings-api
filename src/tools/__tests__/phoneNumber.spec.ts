import { getNationalPhoneNumberAndCountryCode } from '../phoneNumber';

describe('phone number tests', () => {
	describe('getNationalPhoneNumberAndCountryCode', () => {
		it('return empty strings when no booking number is given', () => {
			const result = getNationalPhoneNumberAndCountryCode(undefined);
			expect(result.parsedCountryCode).toEqual('');
			expect(result.parsedPhoneNumber).toEqual('');
		});

		it('return phone number when given', () => {
			const result = getNationalPhoneNumberAndCountryCode('+6591002100');
			expect(result.parsedCountryCode).toEqual('65');
			expect(result.parsedPhoneNumber).toEqual('91002100');
		});

		it('return empty strings when given invalid number', () => {
			const result = getNationalPhoneNumberAndCountryCode('xx');
			expect(result.parsedCountryCode).toEqual('');
			expect(result.parsedPhoneNumber).toEqual('');
		});
	});
});
