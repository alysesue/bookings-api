import { verifyUrl } from '../url';

describe('Test url', () => {
	it('Should throw error if url invalid', () => {
		try {
			verifyUrl();
		} catch (e) {
			expect(e.message).toBe('Invalid URL');
		}
	});
});
