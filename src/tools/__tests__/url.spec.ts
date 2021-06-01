import { verifyUrl, verifyUrlAndLength, verifyUrlLength } from '../url';

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

	it('Should not throw error if url is below length limit', () => {
		const url = verifyUrlLength(`http://www.zoom.us/1234567`);
		expect(url).toEqual(true);
	});

	it('Should throw error if url is above length limit', () => {
		try {
			verifyUrlLength(
				'http://www.zoom.us/1234567812345678123456781234567812345678123456781234567812345678123456781234567812345678123456781234567812345678123456781234567812345678123456781234567812345678123456781234567812345678123456781234567812345678123456781234567812345678123456781234567812345678123456781234567812345678123456781234567812345678123456781234567812345678123456781234567812345678123456781234567812345678123456781234567812345678123456781234567812345678123456781234567812345678',
			);
		} catch (e) {
			expect(e.message).toBe('Invalid URL length');
		}
	});

	it('Should return false if url is undefined', () => {
		const url = verifyUrlAndLength();
		expect(url).toEqual(false);
	});

	it('Should throw error if url is not valid (verifyUrlAndLength)', () => {
		try {
			verifyUrlAndLength('www.zoom.us/1234567');
		} catch (e) {
			expect(e.message).toBe('Invalid URL');
		}
	});

	it('Should throw error if url is valid but above length limit (verifyUrlAndLength)', () => {
		try {
			verifyUrlAndLength(
				'http://www.zoom.us/1234567812345678123456781234567812345678123456781234567812345678123456781234567812345678123456781234567812345678123456781234567812345678123456781234567812345678123456781234567812345678123456781234567812345678123456781234567812345678123456781234567812345678123456781234567812345678123456781234567812345678123456781234567812345678123456781234567812345678123456781234567812345678123456781234567812345678123456781234567812345678123456781234567812345678',
			);
		} catch (e) {
			expect(e.message).toBe('Invalid URL length');
		}
	});
});
