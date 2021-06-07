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

export class DynamicFieldsActionAuthVisitor extends PermissionAwareAuthGroupVisitor {
	private readonly _service: Service;
	private readonly _action: CrudAction;

	constructor(service: Service, action: CrudAction) {
		super();
		this._service = service;
		this._action = action;

		if (!service) {
			throw new Error('DynamicFieldsActionAuthVisitor - Services cannot be null or undefined');
		}

		if (!service.organisationId) {
			throw new Error('DynamicFieldsActionAuthVisitor - Organisation ID cannot be null or undefined');
		}
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
			case CrudAction.Delete:
			case CrudAction.Update:
				if (_userGroup.hasServiceId(serviceId)) {
					this.markWithPermission();
				}
				return;
			default:
				return;
		}
	}

	public visitServiceProvider(_userGroup: ServiceProviderAuthGroup): void {}
}
