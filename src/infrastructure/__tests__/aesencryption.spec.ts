import * as crypto from 'crypto';
import { AesEncryption } from '../aesencryption';

describe('AesEncryption tests', () => {
	it('should validate key size', async () => {
		const someKey = crypto.randomBytes(30);
		const test = () => new AesEncryption(someKey);

		expect(test).toThrowError();
	});

	it('should encrypt and decrypt', async () => {
		const someKey = crypto.randomBytes(32);
		const encryption = new AesEncryption(someKey);

		const someValue = 'Some test value :)';
		const encryptedValue = encryption.encrypt(Buffer.from(someValue, 'utf8'));
		expect(encryptedValue).not.toBe(someValue);
		const fromBase64 = Buffer.from(encryptedValue, 'base64').toString('utf8');
		expect(encryptedValue).not.toBe(fromBase64);

		const decryptedValue = encryption.decrypt(encryptedValue).toString('utf8');
		expect(decryptedValue).toBe(someValue);
	});

	it('should not encrypt to same value, but still decrypt correctly', async () => {
		const someKey = crypto.randomBytes(32);
		const encryption = new AesEncryption(someKey);

		const someValue = 'Some test value :)';
		const encryptedValueA = encryption.encrypt(Buffer.from(someValue, 'utf8'));
		const encryptedValueB = encryption.encrypt(Buffer.from(someValue, 'utf8'));

		expect(encryptedValueA).not.toBe(encryptedValueB);

		const decryptedValueA = encryption.decrypt(encryptedValueA).toString('utf8');
		const decryptedValueB = encryption.decrypt(encryptedValueB).toString('utf8');

		expect(decryptedValueA).toBe(someValue);
		expect(decryptedValueB).toBe(someValue);
	});

	it('should decrypt null value', async () => {
		const someKey = crypto.randomBytes(32);
		const encryption = new AesEncryption(someKey);

		const decryptedValue = encryption.decrypt(null).toString('utf8');
		expect(decryptedValue).toBe('');
	});

	it('should not decrypt random string value', async () => {
		const someKey = crypto.randomBytes(32);
		const encryption = new AesEncryption(someKey);

		for (let i = 0; i < 10000; i++) {
			const value = crypto.randomBytes(128).toString('utf8');
			const decryptedValue = encryption.decrypt(value).toString('utf8');
			expect(decryptedValue).toBe('');
		}
	});

	it('should not decrypt random base64 value', async () => {
		const someKey = crypto.randomBytes(32);
		const encryption = new AesEncryption(someKey);

		const value = crypto.randomBytes(128).toString('base64');
		const decryptedValue = encryption.decrypt(value).toString('utf8');
		expect(decryptedValue).toBe('');
	});
});
