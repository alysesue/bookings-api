import {
	CitizenAuthGroup,
	OrganisationAdminAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../../infrastructure/auth/authGroup';
import {
	PermissionAwareAuthGroupVisitor,
	QueryAuthGroupVisitor,
} from '../../infrastructure/auth/queryAuthGroupVisitor';
import { ServiceProvider } from '../../models/entities';
import { CrudAction } from '../../enums/crudAction';

export class ServiceProvidersQueryAuthVisitor extends QueryAuthGroupVisitor {
	private readonly _alias: string;
	private readonly _serviceAlias: string;

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
		this.addAuthCondition(`${this._alias}._id = :authorisedServiceProviderId`, { authorisedServiceProviderId });
	}
}

export class ServiceProvidersActionAuthVisitor extends PermissionAwareAuthGroupVisitor {
	private readonly serviceProvider: ServiceProvider;
	private readonly action: CrudAction;

	constructor(serviceProvider: ServiceProvider, action: CrudAction) {
		super();
		this.serviceProvider = serviceProvider;
		this.action = action;

		if (!this.serviceProvider) {
			throw new Error('ServiceProvidersActionAuthVisitor - service provider cannot be null');
		}

		if (!this.serviceProvider.service) {
			throw new Error('ServiceProvidersActionAuthVisitor - service cannot be null');
		}
	}

	public visitCitizen(_citizenGroup: CitizenAuthGroup): void {}

	public visitOrganisationAdmin(_userGroup: OrganisationAdminAuthGroup): void {
		const authorisedOrganisationIds = _userGroup.authorisedOrganisations.map((org) => org.id);
		switch (this.action) {
			case CrudAction.Create:
				this.markWithPermission();
				return;
			case CrudAction.Delete:
			case CrudAction.Update:
			case CrudAction.Read:
				if (authorisedOrganisationIds.includes(this.serviceProvider.service.organisationId)) {
					this.markWithPermission();
				}
				return;
			default:
				return;
		}
	}

	public visitServiceAdmin(_userGroup: ServiceAdminAuthGroup): void {
		const serviceIds = _userGroup.authorisedServices.map((service) => service.id);
		switch (this.action) {
			case CrudAction.Create:
				this.markWithPermission();
				return;
			case CrudAction.Delete:
			case CrudAction.Read:
				if (serviceIds.includes(this.serviceProvider.serviceId)) {
					this.markWithPermission();
				}
				return;
			default:
				return;
		}
	}

	public visitServiceProvider(_userGroup: ServiceProviderAuthGroup): void {
		const authorizedServiceProviderId = _userGroup.authorisedServiceProvider.id;
		// tslint:disable-next-line: tsr-detect-possible-timing-attacks
		if (authorizedServiceProviderId === this.serviceProvider.id && CrudAction.Read === this.action) {
			this.markWithPermission();
		}
	}
}
