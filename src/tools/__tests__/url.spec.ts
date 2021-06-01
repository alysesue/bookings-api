import { verifyUrl } from '../url';

describe('Test url', () => {
	it('Should not throw error if url is valid', () => {
		const url = verifyUrl('http://www.zoom.us/1234567');
		expect(url).toEqual(new URL('http://www.zoom.us/1234567'));
	});

	it('Should throw error if url is invalid', () => {
		try {
			verifyUrl();
		} catch (e) {
			expect(e.message).toBe('Invalid URL');
		}
	});
});
