import * as crypto from 'crypto';

const algorithm = 'aes-256-cbc';
const encryptionEncoding = 'base64';
const IV_SIZE = 16;
const SALT_SIZE = 8;

export class AesEncryption {
	private _aesKey: string;
	private _keyEncoding: BufferEncoding;

	public constructor(aesKey: string, keyEncoding: BufferEncoding) {
		if (!aesKey || aesKey.length === 0) {
			throw new Error('Encryption key not found');
		}
		this._aesKey = aesKey;
		this._keyEncoding = keyEncoding;
	}

	private hash128(input: Buffer): Buffer {
		return crypto.createHash('md5').update(input).digest();
	}

	private getKey(): Buffer {
		return Buffer.from(this._aesKey, this._keyEncoding);
	}

	public encrypt(buffer: Buffer): string {
		const ivPublic = crypto.randomBytes(IV_SIZE);
		const ivHash = this.hash128(ivPublic);
		const cipher = crypto.createCipheriv(algorithm, this.getKey(), ivHash);

		const salt = crypto.randomBytes(SALT_SIZE);
		const input = Buffer.concat([salt, buffer]);
		let encrypted = cipher.update(input);
		const final = cipher.final();
		encrypted = Buffer.concat([ivPublic, encrypted, final]);

		return encrypted.toString(encryptionEncoding);
	}

	public decrypt(text: string): Buffer {
		try {
			const key = Buffer.from(this._aesKey, this._keyEncoding);
			const concatenated = Buffer.from(text, encryptionEncoding);
			const ivPublic = concatenated.slice(0, IV_SIZE);
			const ivHash = this.hash128(ivPublic);
			const encryptedValue = concatenated.slice(IV_SIZE);

			const decipher = crypto.createDecipheriv(algorithm, this.getKey(), ivHash);
			let decrypted = decipher.update(encryptedValue);
			const final = decipher.final();
			decrypted = Buffer.concat([decrypted, final]);
			const decryptedNoSalt = decrypted.slice(SALT_SIZE);
			return decryptedNoSalt;
		} catch (e) {
			return Buffer.from([]);
		}
	}
}
