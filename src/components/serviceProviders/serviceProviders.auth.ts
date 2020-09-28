import {
	CitizenAuthGroup,
	OrganisationAdminAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../../infrastructure/auth/authGroup';
import { QueryAuthGroupVisitor } from '../../infrastructure/auth/queryAuthGroupVisitor';

export class ServiceProvidersQueryAuthVisitor extends QueryAuthGroupVisitor {
	private _alias: string;
	private _serviceAlias: string;

	constructor(alias: string, serviceAlias: string) {
		super();
		this._alias = alias;
		this._serviceAlias = serviceAlias;
	}

	public visitCitizen(_citizenGroup: CitizenAuthGroup): void {
		this.addAsTrue();
	}

	public visitOrganisationAdmin(_userGroup: OrganisationAdminAuthGroup): void {
		const authorisedOrganisationIds = _userGroup.authorisedOrganisations.map((org) => org.id);
		this.addAuthCondition(`${this._serviceAlias}."_organisationId" IN (:...authorisedOrganisationIds)`, {
			authorisedOrganisationIds,
		});
	}

	public visitServiceAdmin(_userGroup: ServiceAdminAuthGroup): void {
		const authorisedServiceIds = _userGroup.authorisedServices.map((s) => s.id);
		this.addAuthCondition(`${this._alias}."_serviceId" IN (:...authorisedServiceIds)`, { authorisedServiceIds });
	}

	public visitServiceProvider(_userGroup: ServiceProviderAuthGroup): void {
		const authorisedServiceProviderId = _userGroup.authorisedServiceProvider.id;
		this.addAuthCondition(`${this._alias}."_id" = :authorisedServiceProviderId`, { authorisedServiceProviderId });
	}
}
