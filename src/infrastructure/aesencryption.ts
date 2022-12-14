import * as crypto from 'crypto';

const algorithm = 'aes-256-cbc';
const expectedKeyBytes = 32;
export const ENCRYPTION_ENCODING = 'base64';
const IV_SIZE = 16;
const HASH_SIZE = 16;
const SALT_SIZE = 8;

export class AesEncryption {
	private _aeskey: Uint8Array;

	public constructor(buffer: Buffer) {
		if (buffer.length !== expectedKeyBytes) {
			throw new Error(`Encryption key must have ${expectedKeyBytes} bytes.`);
		}

		this._aeskey = new Uint8Array(buffer);
	}

	private hash128(input: Buffer): Buffer {
		return crypto.createHash('md5').update(input).digest();
	}

	public encrypt(buffer: Buffer): string {
		const ivPublic = crypto.randomBytes(IV_SIZE);
		const ivHash = this.hash128(ivPublic);
		const cipher = crypto.createCipheriv(algorithm, this._aeskey, ivHash, { autoDestroy: true });

		const salt = crypto.randomBytes(SALT_SIZE);
		const input = Buffer.concat([salt, ivHash, buffer]);
		let encrypted = cipher.update(input);
		const final = cipher.final();
		encrypted = Buffer.concat([ivPublic, encrypted, final]);

		return encrypted.toString(ENCRYPTION_ENCODING);
	}

	public decrypt(text: string): Buffer {
		try {
			const concatenated = Buffer.from(text, ENCRYPTION_ENCODING);
			const ivPublic = concatenated.slice(0, IV_SIZE);
			const ivHash = this.hash128(ivPublic);
			const encryptedValue = concatenated.slice(IV_SIZE);

			const decipher = crypto.createDecipheriv(algorithm, this._aeskey, ivHash, { autoDestroy: true });
			let decrypted = decipher.update(encryptedValue);
			const final = decipher.final();
			decrypted = Buffer.concat([decrypted, final]);

			const decryptedNoSalt = decrypted.slice(SALT_SIZE);
			const ivHashDecryped = decryptedNoSalt.slice(0, HASH_SIZE);
			if (!ivHashDecryped.equals(ivHash)) {
				return Buffer.from([]);
			}
			const decryptedNoIvHash = decryptedNoSalt.slice(HASH_SIZE);
			return decryptedNoIvHash;
		} catch (e) {
			return Buffer.from([]);
		}
	}
}
