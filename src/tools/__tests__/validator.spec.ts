import { isSGUinfin, isXOR } from '../validator';

describe('Validators', () => {
	describe('Validate NRIC', () => {
		it('It should accept X series NRIC', () => {
			const res = isSGUinfin('X9400291U');
			expect(res.pass).toBe(true);
		});

		it('It should accept S series NRIC', () => {
			const res = isSGUinfin('S9400291E');
			expect(res.pass).toBe(true);
		});

		it('It should accept T series NRIC', () => {
			const res = isSGUinfin('T9400291A');
			expect(res.pass).toBe(true);
		});

		it('It should accept F series NRIC', () => {
			const res = isSGUinfin('F9400291P');
			expect(res.pass).toBe(true);
		});

		it('It should accept G series NRIC', () => {
			const res = isSGUinfin('G9400291K');
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

	describe('Validate XOR', () => {
		it('Both true should return false', () => {
			const res = isXOR(true, true);
			expect(res).toBe(false);
		});

		it('Both false should return false', () => {
			const res = isXOR(false, false);
			expect(res).toBe(false);
		});

		it('a is false, b is true should return true', () => {
			const res = isXOR(false, true);
			expect(res).toBe(true);
		});

		it('a is true, b is false should return true', () => {
			const res = isXOR(true, false);
			expect(res).toBe(true);
		});
	});
});
