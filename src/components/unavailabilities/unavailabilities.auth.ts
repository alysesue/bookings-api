import { Booking, ChangeLogAction } from '../../models';
import {
	AuthGroup,
	CitizenAuthGroup,
	IAuthGroupVisitor,
	OrganisationAdminAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../../infrastructure/auth/authGroup';
import { QueryAuthGroupVisitor } from '../../infrastructure/auth/queryAuthGroupVisitor';

export class UnavailabilitiesQueryAuthVisitor extends QueryAuthGroupVisitor {
	private _alias: string;
	private _serviceAlias: string;

	constructor(alias: string, serviceAlias: string) {
		super();
		this._alias = alias;
		this._serviceAlias = serviceAlias;
	}

	public visitCitizen(_citizenGroup: CitizenAuthGroup): void {
		this.addAuthCondition('FALSE', {});
	}

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
		this.addAuthCondition(
			'(u."_allServiceProviders" AND EXISTS(SELECT 1 FROM public.service_provider esp WHERE esp."_id" = :authorisedServiceProviderId AND esp."_serviceId" = u."_serviceId")) OR ' +
				'EXISTS(SELECT 1 FROM public.unavailable_service_provider usp WHERE usp."unavailability_id" = u."_id" AND usp."serviceProvider_id" = :authorisedServiceProviderId)',
			{
				authorisedServiceProviderId,
			},
		);
	}
}
