import { Service } from '../../models';
import { PermissionAwareAuthGroupVisitor } from '../../infrastructure/auth/queryAuthGroupVisitor';
import { CrudAction } from '../../enums/crudAction';
import {
	AnonymousAuthGroup,
	CitizenAuthGroup,
	OrganisationAdminAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../../infrastructure/auth/authGroup';

export class NotificationTemplateActionAuthVisitor extends PermissionAwareAuthGroupVisitor {
	private readonly _service: Service;
	private readonly _action: CrudAction;

	constructor(service: Service, action: CrudAction) {
		super();
		if (!service) {
			throw new Error('NotificationTemplateActionAuthVisitor - Service cannot be null or undefined');
		}

		if (!action) {
			throw new Error('NotificationTemplateActionAuthVisitor - Action cannot be null or undefined');
		}

		this._service = service;
		this._action = action;
	}

	public visitAnonymous(_anonymousGroup: AnonymousAuthGroup): void {}

	public visitCitizen(_citizenGroup: CitizenAuthGroup): void {}

	public visitOrganisationAdmin(_userGroup: OrganisationAdminAuthGroup): void {
		const organisationId = this._service.organisationId;
		if (_userGroup.hasOrganisationId(organisationId)) {
			this.markWithPermission();
		}
	}

	public visitServiceAdmin(_userGroup: ServiceAdminAuthGroup): void {
		const serviceId = this._service.id;
		switch (this._action) {
			case CrudAction.Create:
			case CrudAction.Read:
			case CrudAction.Update:
				if (_userGroup.hasServiceId(serviceId)) {
					this.markWithPermission();
				}
				return;
		}
	}

	public visitServiceProvider(_userGroup: ServiceProviderAuthGroup): void {}
}
