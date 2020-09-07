import { validateEmail } from '../email';

describe('Test email rules', () => {
	it('Validate email number', () => {
		expect(validateEmail('')).toBeFalsy();
		expect(validateEmail('ad.com')).toBeFalsy();
		expect(validateEmail('ad@gg.com')).toBeTruthy();
		expect(validateEmail('aaa@ss')).toBeFalsy();
	});
});
