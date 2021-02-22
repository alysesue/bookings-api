import {
	AnonymousAuthGroup,
	CitizenAuthGroup,
	IAuthGroupVisitor,
	OrganisationAdminAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../../infrastructure/auth/authGroup';
import { UserContextSnapshot } from '../../infrastructure/auth/userContext';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';

export type EncryptionSignatureUser = {
	user: string;
	code: string;
};

export class EncryptionAuthVisitor implements IAuthGroupVisitor {
	private readonly signatureUser?: EncryptionSignatureUser;

	public constructor(signatureUser?: EncryptionSignatureUser) {
		this.signatureUser = signatureUser;
	}

	private throwIfSignatureButNotCitizen(): void {
		if (this.signatureUser) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_AUTHORIZATION).setMessage(
				`Current user cannot decrypt a signed message`,
			);
		}
	}

	public visitAnonymous(_anonymousGroup: AnonymousAuthGroup): void {
		this.throwIfSignatureButNotCitizen();
	}

	public visitCitizen(_citizenGroup: CitizenAuthGroup): void {
		const code = _citizenGroup.user._singPassUser.UinFin;
		if (this.signatureUser?.user && code !== this.signatureUser?.code) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_AUTHORIZATION).setMessage(
				`This user cannot decrypt this message.`,
			);
		}
	}

	public visitOrganisationAdmin(_userGroup: OrganisationAdminAuthGroup): void {
		this.throwIfSignatureButNotCitizen();
	}

	public visitServiceAdmin(_userGroup: ServiceAdminAuthGroup): void {
		this.throwIfSignatureButNotCitizen();
	}

	public visitServiceProvider(_userGroup: ServiceProviderAuthGroup): void {
		this.throwIfSignatureButNotCitizen();
	}

	public validateSignature(userContext: UserContextSnapshot): void {
		for (const group of userContext.authGroups) {
			group.acceptVisitor(this);
		}
	}
}
