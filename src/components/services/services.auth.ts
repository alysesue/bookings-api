import {
	CitizenAuthGroup,
	OrganisationAdminAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../../infrastructure/auth/authGroup';
import { QueryAuthGroupVisitor } from '../../infrastructure/auth/queryAuthGroupVisitor';

export class OrganisationQueryAuthVisitor extends QueryAuthGroupVisitor {
	private _alias: string;

	constructor(alias: string) {
		super();
		this._alias = alias;
	}

	public visitCitizen(_citizenGroup: CitizenAuthGroup): void {
		this.addAsTrue();
	}

	public visitOrganisationAdmin(_userGroup: OrganisationAdminAuthGroup): void {
		const authorisedOrganisationIds = _userGroup.authorisedOrganisations.map((org) => org.id);
		this.addAuthCondition(`${this._alias}._id IN (:...authorisedOrganisationIds)`, { authorisedOrganisationIds });
	}

	private addFilterForServiceIds(authorisedServiceIds: number[]) {
		this.addAuthCondition(
			`EXISTS (SELECT 1 FROM public.service as svc where svc."_organisationId" = ${this._alias}._id and svc._id IN (:...authorisedServiceIds))`,
			{ authorisedServiceIds },
		);
	}

	public visitServiceAdmin(_userGroup: ServiceAdminAuthGroup): void {
		const authorisedServiceIds = _userGroup.authorisedServices.map((s) => s.id);
		this.addFilterForServiceIds(authorisedServiceIds);
	}

	public visitServiceProvider(_userGroup: ServiceProviderAuthGroup): void {
		const serviceId = _userGroup.authorisedServiceProvider.serviceId;
		this.addFilterForServiceIds([serviceId]);
	}
}
