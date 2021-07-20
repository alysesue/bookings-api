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
import { Service } from '../../models';
import { CrudAction } from '../../enums/crudAction';

export class NotificationTemplateActionAuthVisitor extends PermissionAwareAuthGroupVisitor {
	private readonly _service: Service;
	private readonly _action: CrudAction;

	constructor(service: Service, action: CrudAction) {
		super();
		this._service = service;
		this._action = action;

		if (!service) {
			throw new Error('NotificationTemplateActionAuthVisitor - Service cannot be null or undefined');
		}

		if (!service.organisationId) {
			throw new Error('NotificationTemplateActionAuthVisitor - Organisation ID cannot be null or undefined');
		}

		if (!action) {
			throw new Error('NotificationTemplateActionAuthVisitor - Action cannot be null or undefined');
		}
	}

	public visitAnonymous(_anonymousGroup: AnonymousAuthGroup): void {}

	public visitCitizen(_citizenGroup: CitizenAuthGroup): void {}

	public visitServiceProvider(_userGroup: ServiceProviderAuthGroup): void {}

	public visitOrganisationAdmin(_userGroup: OrganisationAdminAuthGroup): void {
		const organisationId = this._service.organisationId;
		if (_userGroup.hasOrganisationId(organisationId)) {
			this.markWithPermission();
		}
	}

	public visitServiceAdmin(_userGroup: ServiceAdminAuthGroup): void {
		const serviceId = this._service.id;
		switch (this._action) {
			// ToDo: ask sam if SA should be able to create a template. currently it can.
			case CrudAction.Delete:
				return;
			case CrudAction.Create:
			case CrudAction.Update:
				if (_userGroup.hasServiceId(serviceId)) {
					this.markWithPermission();
				}
				return;
			default:
				return;
		}
	}
}

export class NotificationTemplateQueryAuthVisitor extends QueryAuthGroupVisitor {
	private _alias: string;
	private readonly _serviceAlias: string;

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
		this.addAuthCondition(`${this._alias}._serviceId IN (:...authorisedServiceIds)`, {
			authorisedServiceIds,
		});
	}

	// ToDo: ask sam if sp should have permission to read
	public visitServiceProvider(_userGroup: ServiceProviderAuthGroup): void {
		const serviceProviderServiceId = _userGroup.authorisedServiceProvider.serviceId;
		this.addAuthCondition(`${this._alias}._serviceId = :serviceProviderServiceId`, {
			serviceProviderServiceId,
		});
	}
}
