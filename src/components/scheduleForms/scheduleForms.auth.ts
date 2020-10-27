// tslint:disable: tsr-detect-possible-timing-attacks
import {
	CitizenAuthGroup,
	OrganisationAdminAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../../infrastructure/auth/authGroup';
import { ServiceProvider } from '../../models';
import {
	PermissionAwareAuthGroupVisitor,
	QueryAuthGroupVisitor,
} from '../../infrastructure/auth/queryAuthGroupVisitor';
import { CrudAction } from '../../enums/crudAction';

export class ScheduleFormsActionAuthVisitor extends PermissionAwareAuthGroupVisitor {
	private _serviceProvider: ServiceProvider;
	private _action: CrudAction;
	constructor(serviceProvider: ServiceProvider, action: CrudAction) {
		super();
		if (!serviceProvider) {
			throw new Error('ScheduleFormsActionAuthVisitor - ScheduleForm cannot be null.');
		}
		if (serviceProvider && !serviceProvider.service) {
			throw new Error('ScheduleFormsActionAuthVisitor - Service is not loaded in Service Provider.');
		}

		this._action = action;
		this._serviceProvider = serviceProvider;
	}

	public visitCitizen(_citizenGroup: CitizenAuthGroup): void {}

	public visitOrganisationAdmin(_userGroup: OrganisationAdminAuthGroup): void {
		switch (this._action) {
			case CrudAction.Create:
			case CrudAction.Read:
			case CrudAction.Update:
				const organisationId = this._serviceProvider.service.organisationId;
				if (_userGroup.hasOrganisationId(organisationId)) {
					this.markWithPermission();
				}
				return;
			default:
				return;
		}
	}

	public visitServiceAdmin(_userGroup: ServiceAdminAuthGroup): void {
		switch (this._action) {
			case CrudAction.Create:
			case CrudAction.Read:
			case CrudAction.Update:
				const serviceId = this._serviceProvider.serviceId;
				if (_userGroup.hasServiceId(serviceId)) {
					this.markWithPermission();
				}
				return;
			default:
				return;
		}
	}
	public visitServiceProvider(_userGroup: ServiceProviderAuthGroup): void {
		switch (this._action) {
			case CrudAction.Create:
			case CrudAction.Read:
			case CrudAction.Update:
				const serviceProviderId = this._serviceProvider.id;
				// tslint:disable-next-line: tsr-detect-possible-timing-attacks
				if (_userGroup.authorisedServiceProvider.id === serviceProviderId) {
					this.markWithPermission();
				}
				return;
			default:
				return;
		}
	}
}
export class ScheduleFormsQueryAuthVisitor extends QueryAuthGroupVisitor {
	private readonly _serviceProviderAlias: string;
	private readonly _serviceAlias: string;

	constructor(serviceAlias: string, serviceProviderAlias: string) {
		super();
		this._serviceAlias = serviceAlias;
		this._serviceProviderAlias = serviceProviderAlias;
	}

	public visitCitizen(_citizenGroup: CitizenAuthGroup): void {
		this.addAuthCondition('FALSE', {});
	}

	public visitOrganisationAdmin(_userGroup: OrganisationAdminAuthGroup): void {
		const orgIds = _userGroup.authorisedOrganisations.map((org) => org.id);
		this.addAuthCondition(`${this._serviceAlias}._organisationId IN (:...orgIds)`, { orgIds });
	}

	public visitServiceAdmin(_userGroup: ServiceAdminAuthGroup): void {
		const serviceIds = _userGroup.authorisedServices.map((s) => s.id);
		this.addAuthCondition(`${this._serviceAlias}._id IN (:...serviceIds)`, { serviceIds });
	}

	public visitServiceProvider(_userGroup: ServiceProviderAuthGroup): void {
		const serviceProviderId = _userGroup.authorisedServiceProvider.id;

		this.addAuthCondition(`${this._serviceProviderAlias}._id = :serviceProviderId`, { serviceProviderId });
	}
}
