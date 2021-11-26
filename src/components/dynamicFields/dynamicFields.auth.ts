import { Service } from '../../models';
import { PermissionAwareAuthGroupVisitor } from '../../infrastructure/auth/queryAuthGroupVisitor';
import { VisitorCrudAction } from '../../enums/crudAction';
import {
	AnonymousAuthGroup,
	CitizenAuthGroup,
	OrganisationAdminAuthGroup,
	OtpAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../../infrastructure/auth/authGroup';

export class DynamicFieldsActionAuthVisitor extends PermissionAwareAuthGroupVisitor {
	private readonly _service: Service;
	private readonly _action: VisitorCrudAction;

	constructor(service: Service, action: VisitorCrudAction) {
		super();
		if (!service) {
			throw new Error('DynamicFieldsActionAuthVisitor - Service cannot be null or undefined');
		}

		if (!action) {
			throw new Error('DynamicFieldsActionAuthVisitor - Action cannot be null or undefined');
		}

		this._service = service;
		this._action = action;
	}

	public visitOtp(_otpGroup: OtpAuthGroup): void {}

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
			case VisitorCrudAction.Create:
			case VisitorCrudAction.Update:
			case VisitorCrudAction.Delete:
				if (_userGroup.hasServiceId(serviceId)) {
					this.markWithPermission();
				}
				return;
		}
	}

	public visitServiceProvider(_userGroup: ServiceProviderAuthGroup): void {}
}
