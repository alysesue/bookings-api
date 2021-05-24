// tslint:disable tsr-detect-possible-timing-attacks
import { Unavailability } from '../../models';
import {
	AnonymousAuthGroup,
	CitizenAuthGroup,
	OrganisationAdminAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../../infrastructure/auth/authGroup';
import {
	PermissionAwareAuthGroupVisitor,
	QueryAuthGroupVisitor,
} from '../../infrastructure/auth/queryAuthGroupVisitor';
import { CrudAction } from '../../enums/crudAction';

export class UnavailabilitiesQueryAuthVisitor extends QueryAuthGroupVisitor {
	private _alias: string;
	private _serviceAlias: string;

	constructor(alias: string, serviceAlias: string) {
		super();
		this._alias = alias;
		this._serviceAlias = serviceAlias;
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
		this.addAuthCondition(
			`(${this._alias}."_allServiceProviders" AND EXISTS(SELECT 1 FROM public.service_provider esp WHERE esp."_id" = :authorisedServiceProviderId AND esp."_serviceId" = ${this._alias}."_serviceId")) OR ` +
				`EXISTS(SELECT 1 FROM public.unavailable_service_provider usp WHERE usp."unavailability_id" = ${this._alias}."_id" AND usp."serviceProvider_id" = :authorisedServiceProviderId)`,
			{
				authorisedServiceProviderId,
			},
		);
	}
}

export class UnavailabilitiesActionAuthVisitor extends PermissionAwareAuthGroupVisitor {
	private readonly unavailability: Unavailability;
	private readonly action: CrudAction;
	constructor(unavailability: Unavailability, action: CrudAction) {
		super();
		this.unavailability = unavailability;
		this.action = action;
		if (!this.unavailability) {
			throw new Error('UnavailabilitiesActionAuthVisitor - unavailability cannot be null');
		}
		if (!this.unavailability.service) {
			throw new Error('UnavailabilitiesActionAuthVisitor - service cannot be null');
		}
	}

	public visitAnonymous(_anonymousGroup: AnonymousAuthGroup): void {}

	public visitCitizen(_citizenGroup: CitizenAuthGroup): void {}

	public visitOrganisationAdmin(_userGroup: OrganisationAdminAuthGroup): void {
		if (_userGroup.hasOrganisationId(this.unavailability.service.organisationId)) {
			this.markWithPermission();
		}
	}

	public visitServiceAdmin(_userGroup: ServiceAdminAuthGroup): void {
		if (_userGroup.hasServiceId(this.unavailability.serviceId)) {
			this.markWithPermission();
		}
	}
	public visitServiceProvider(_userGroup: ServiceProviderAuthGroup): void {
		const hasServiceProvider = this.unavailability.serviceProviders.some(
			(sp) => sp.id === _userGroup.authorisedServiceProvider.id,
		);

		// tslint:disable-next-line: no-small-switch
		switch (this.action) {
			case CrudAction.Delete:
				if (!this.unavailability.allServiceProviders && hasServiceProvider) {
					this.markWithPermission();
				}
				break;
			default:
				if (hasServiceProvider) {
					this.markWithPermission();
				}
		}
	}
}
