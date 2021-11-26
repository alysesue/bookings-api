import { UserContextSnapshot } from '../infrastructure/auth/userContext';
import {
	AnonymousAuthGroup,
	CitizenAuthGroup,
	IAuthGroupVisitor,
	OrganisationAdminAuthGroup,
	OtpAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../infrastructure/auth/authGroup';
import { Organisation } from './entities/organisation';

export class UinFinConfiguration implements IAuthGroupVisitor {
	private _org: Organisation;
	private _canViewPlainUinFin: boolean;

	constructor(org: Organisation) {
		this._org = org;
	}

	public visitAnonymous(_anonymousGroup: AnonymousAuthGroup): void {}
	public visitOtp(_otpGroup: OtpAuthGroup): void {}
	public visitCitizen(_citizenGroup: CitizenAuthGroup): void {}

	public visitOrganisationAdmin(_userGroup: OrganisationAdminAuthGroup): void {
		const orgAdminConfiguration = this._org.configuration.AuthGroups?.OrganisationAdmin;
		if (
			_userGroup.authorisedOrganisations.some((o) => o.id === this._org.id) &&
			orgAdminConfiguration?.ViewPlainUinFin === true
		) {
			this._canViewPlainUinFin = true;
		}
	}

	public visitServiceAdmin(_userGroup: ServiceAdminAuthGroup): void {
		const serviceAdminConfiguration = this._org.configuration.AuthGroups?.ServiceAdmin;
		if (
			_userGroup.authorisedServices.some((svc) => svc.organisationId === this._org.id) &&
			serviceAdminConfiguration?.ViewPlainUinFin === true
		) {
			this._canViewPlainUinFin = true;
		}
	}

	public visitServiceProvider(_userGroup: ServiceProviderAuthGroup): void {
		const serviceProviderConfiguration = this._org.configuration.AuthGroups?.ServiceProvider;
		if (
			// tslint:disable-next-line: tsr-detect-possible-timing-attacks
			_userGroup.authorisedServiceProvider.service.organisationId === this._org.id &&
			serviceProviderConfiguration?.ViewPlainUinFin === true
		) {
			this._canViewPlainUinFin = true;
		}
	}

	public canViewPlainUinFin(userContext: UserContextSnapshot): boolean {
		if (userContext.user.isAgency()) {
			return true;
		}

		this._canViewPlainUinFin = false;
		for (const group of userContext.authGroups) {
			group.acceptVisitor(this);
		}

		return this._canViewPlainUinFin;
	}
}
