import { QueryAuthGroupVisitor } from '../../infrastructure/auth/queryAuthGroupVisitor';
import {
	AnonymousAuthGroup,
	CitizenAuthGroup,
	OrganisationAdminAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../../infrastructure/auth/authGroup';

export class BookingChangeLogsQueryAuthVisitor extends QueryAuthGroupVisitor {
	private readonly _alias: string;
	private readonly _serviceAlias: string;
	private readonly _bookingAlias: string;

	constructor(alias: string, serviceAlias: string, bookingAlias: string) {
		super();
		this._alias = alias;
		this._serviceAlias = serviceAlias;
		this._bookingAlias = bookingAlias;
	}

	public visitAnonymous(_anonymousGroup: AnonymousAuthGroup): void {}

	public visitCitizen(_citizenGroup: CitizenAuthGroup): void {}

	public visitOrganisationAdmin(_userGroup: OrganisationAdminAuthGroup): void {
		const authorisedOrganisationIds = _userGroup.authorisedOrganisations.map((org) => org.id);
		this.addAuthCondition(`${this._serviceAlias}."_organisationId" IN (:...authorisedOrganisationIds)`, {
			authorisedOrganisationIds,
		});
	}

	public visitServiceAdmin(_userGroup: ServiceAdminAuthGroup): void {
		const authorisedServiceIds = _userGroup.authorisedServices.map((s) => s.id);
		this.addAuthCondition(`${this._alias}."_serviceId" IN (:...authorisedServiceIds)`, {
			authorisedServiceIds,
		});
	}

	public visitServiceProvider(_userGroup: ServiceProviderAuthGroup): void {
		const authorisedServiceProviderId = _userGroup.authorisedServiceProvider.id;
		this.addAuthCondition(`${this._bookingAlias}."_serviceProviderId" = :authorisedServiceProviderId`, {
			authorisedServiceProviderId,
		});
	}
}
