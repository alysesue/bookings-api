import {
	CitizenAuthGroup,
	OrganisationAdminAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../../infrastructure/auth/authGroup';
import {PermissionAwareAuthGroupVisitor, QueryAuthGroupVisitor} from '../../infrastructure/auth/queryAuthGroupVisitor';
import {ChangeLogAction, Service, ServiceProvider} from "../../models";

export class ServicesActionAuthVisitor extends PermissionAwareAuthGroupVisitor {
	private _service: Service;
	private _serviceProvider: ServiceProvider;
	private readonly _changeLogAction: ChangeLogAction;

	constructor(service: Service, changeLogAction: ChangeLogAction) {
		super();

		if(!service) {
			throw new Error('ServicesActionAuthVisitor - Services cannot be null or undefined')
		}

		this._service = service;
		this._changeLogAction = changeLogAction;
	}

	public visitCitizen(_citizenGroup: CitizenAuthGroup): void {
		//TODO
	}

	public visitOrganisationAdmin(_userGroup: OrganisationAdminAuthGroup): void {
		const organisationId = this._service.organisationId;
		if(_userGroup.hasOrganisationId(organisationId)) {
			this.markWithPermission()
		}
	}

	public visitServiceAdmin(_userGroup: ServiceAdminAuthGroup): void {
		const serviceId = this._service.id;
		if(_userGroup.hasServiceId(serviceId)) {
			this.markWithPermission();
		}
	}

	public visitServiceProvider(_userGroup: ServiceProviderAuthGroup): void {
		const serviceProviderId = this._serviceProvider.id;
		if(_userGroup.authorisedServiceProvider.id === serviceProviderId) {
			this.markWithPermission();
		}
	}
}

export class ServicesQueryAuthVisitor extends QueryAuthGroupVisitor {
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
		this.addAuthCondition(`${this._alias}."_organisationId" IN (:...authorisedOrganisationIds)`, {
			authorisedOrganisationIds,
		});
	}

	public visitServiceAdmin(_userGroup: ServiceAdminAuthGroup): void {
		const authorisedServiceIds = _userGroup.authorisedServices.map((s) => s.id);
		this.addAuthCondition(`${this._alias}._id IN (:...authorisedServiceIds)`, {
			authorisedServiceIds,
		});
	}

	public visitServiceProvider(_userGroup: ServiceProviderAuthGroup): void {
		const serviceProviderServiceId = _userGroup.authorisedServiceProvider.serviceId;
		this.addAuthCondition(`${this._alias}._id = :serviceProviderServiceId`, {
			serviceProviderServiceId,
		});
	}
}
