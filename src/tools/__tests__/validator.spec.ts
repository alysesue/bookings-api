import { isSGUinfin } from '../validator';

describe('Validate NRIC', () => {
	it('It should accept X series NRIC', () => {
		const res = isSGUinfin('X9400291U');
		expect(res.pass).toBe(true);
	});

	it('It should accept S series NRIC', () => {
		const res = isSGUinfin('S9400291U');
		expect(res.pass).toBe(true);
	});

	it('It should accept T series NRIC', () => {
		const res = isSGUinfin('T9400291U');
		expect(res.pass).toBe(true);
	});

	it('It should accept F series NRIC', () => {
		const res = isSGUinfin('F9400291U');
		expect(res.pass).toBe(true);
	});

	it('It should accept G series NRIC', () => {
		const res = isSGUinfin('G9400291U');
		expect(res.pass).toBe(true);
	});

	it('It should not accept anything except XSTFG series NRIC', () => {
		const res = isSGUinfin('Z9400291U');
		expect(res.pass).toBe(false);
	});

	it('It should return validation error when string is undefined', () => {
		const res = isSGUinfin();
		expect(res.pass).toBe(false);
	});

	it('It should return validation error when string is null', () => {
		const res = isSGUinfin(null);
		expect(res.pass).toBe(false);
	});
});
