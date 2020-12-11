import * as crypto from 'crypto';
import { AesEncryption } from "../aesencryption";

describe('AesEncryption tests', () => {
	it('should encrypt and decrypt', async () => {
		const someKey = crypto.randomBytes(32);
		console.log(someKey.toString('base64'));

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
});
