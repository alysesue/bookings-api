import { EncryptionAuthVisitor } from '../encryption.auth';

export class EncryptionAuthVisitorMock implements Partial<EncryptionAuthVisitor> {
	public static validatedSignatureMock = jest.fn();

	public validateSignature(...param): void {
		return EncryptionAuthVisitorMock.validatedSignatureMock(...param);
	}
}
