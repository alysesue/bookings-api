import { Inject, InRequestScope } from 'typescript-ioc';
import { AesEncryption, ENCRYPTION_ENCODING } from '../../infrastructure/aesencryption';
import { getConfig } from '../../config/app-config';
import { Compression } from '../../infrastructure/compression';
import { DateHelper } from '../../infrastructure/dateHelper';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { EncryptionAuthVisitor, EncryptionSignatureUser } from './encryption.auth';
import { UserContext } from '../../infrastructure/auth/userContext';

@InRequestScope
export class EncryptionService {
	private _encryptor: AesEncryption;
	private EXPIRE_IN_SEC = 60 * 60 * 24 * 30;

	@Inject
	private userContext: UserContext;

	constructor() {
		const config = getConfig();
		const key = Buffer.from(config.encryptionKey, ENCRYPTION_ENCODING);
		this._encryptor = new AesEncryption(key);
	}

	private async encryptAddMetadata<T extends GenericEncryptionData>(data: T, signatureSingpassUser): Promise<T> {
		if (data?.uinfin && signatureSingpassUser) {
			const signatureMessage: EncryptionSignatureUser = {
				user: 'singPassUser',
				code: data.uinfin,
			};
			data = { ...data, signatureMessage };
		}

		data = { ...data, encryptExpiryDate: new Date() };
		return data;
	}

	public async encrypt<T extends GenericEncryptionData>(data: T, signatureSingpassUser = false): Promise<string> {
		data = await this.encryptAddMetadata(data, signatureSingpassUser);

		const stringJson = JSON.stringify(data);
		const buffData = Buffer.from(stringJson, 'utf8');
		const compressedData = Compression.compress(buffData);
		const encrypted = this._encryptor.encrypt(compressedData);
		return encodeURIComponent(encrypted);
	}

	private async decryptVerifyMetadata<T extends EncryptionMetadata>(data: T): Promise<T> {
		const userContextSnap = await this.userContext.getSnapshot();
		new EncryptionAuthVisitor(data.signatureMessage).validateSignature(userContextSnap);
		if (
			this.EXPIRE_IN_SEC &&
			DateHelper.DiffInSeconds(new Date(), new Date(data.encryptExpiryDate)) > this.EXPIRE_IN_SEC
		)
			throw new MOLErrorV2(ErrorCodeV2.SYS_GENERIC).setMessage(`Message expired`);
		delete data.encryptExpiryDate;
		delete data.signatureMessage;
		return data;
	}

	public async decrypt<T>(object: string): Promise<T> {
		const decodeURI = decodeURIComponent(object);
		let decrypted;
		try {
			decrypted = this._encryptor.decrypt(decodeURI);
		} catch (e) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('Decrypt failed.');
		}
		const decompress = Compression.decompress(decrypted);
		const decode = decompress.toString('utf8');
		let data = JSON.parse(decode);
		data = this.decryptVerifyMetadata(data);

		return data;
	}
}

type EncryptionMetadata = {
	signatureMessage: EncryptionSignatureUser;
	encryptExpiryDate: number;
};

export type GenericEncryptionData = {
	uinfin?: string;
};
