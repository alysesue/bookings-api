import { ConcurrencyError } from '../ConcurrencyError';
import { ParseTimeError } from '../ParseTimeError';

describe('custom errors tests', () => {
	it('should create concurrency error', () => {
		const error = new ConcurrencyError('Some error');
		expect(error.name).toBe('ConcurrencyError');
		expect(error.message).toBe('Some error');
	});

	it('should create ParseTimeError', () => {
		const error = new ParseTimeError('Some error');
		expect(error.name).toBe('ParseTimeError');
		expect(error.message).toBe('Some error');
	});
});
