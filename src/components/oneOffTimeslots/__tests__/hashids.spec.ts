const Hashids = require('hashids');
import * as crypto from 'crypto';
import { StopWatch } from '../../../infrastructure/stopWatch';

function generateSalt(length: number): string {
	const someKey = crypto.randomBytes(length);
	return someKey.toString('base64').slice(0, length);
}

describe('hashids tests', () => {
	const salt = 'wobBINrJe916YEbgwov6F+5eZUVhTLav5/CQ6zf1p5lE1uPNI6SWZAhPeiJWv';
	const minLength = 8;

	it('should generate same id', () => {
		const originalValue = 1;

		const hashids = new Hashids(salt, minLength);
		const encoded = hashids.encode([originalValue]);
		const decoded = hashids.decode(encoded)[0] as number;

		expect(encoded).toBe('9EVyxJKe');
		expect(decoded).toBe(originalValue);
	});

	it('should generate unique ids', () => {
		const values = new Set();
		const hashids = new Hashids(salt, minLength);

		const hashIdStopWatch = new StopWatch('HashId encode');
		for (let originalValue = 0; originalValue < 10000; originalValue++) {
			const encoded = hashids.encode([originalValue]);

			expect(values.has(encoded)).toBeFalsy();
			values.add(encoded);
		}
		hashIdStopWatch.stop();

		const hashIdDecodeStopWatch = new StopWatch('HashId decode');
		for (const value of values) {
			hashids.decode(value);
		}
		hashIdDecodeStopWatch.stop();
	});

	it('should create key', async () => {
		console.log(generateSalt(61));
	});
});
