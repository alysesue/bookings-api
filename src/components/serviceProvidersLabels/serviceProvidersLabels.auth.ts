import { CrudAction } from '../../enums/crudAction';
import {
	AnonymousAuthGroup,
	CitizenAuthGroup,
	OrganisationAdminAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../../infrastructure/auth/authGroup';
import { PermissionAwareAuthGroupVisitor } from '../../infrastructure/auth/queryAuthGroupVisitor';
import { Organisation } from '../../models';

export class ServiceProvidersLabelsActionAuthVisitor extends PermissionAwareAuthGroupVisitor {
	private readonly _organisation: Organisation;
	private readonly _action: CrudAction;

	constructor(organisation: Organisation, action: CrudAction) {
		super();
		this._organisation = organisation;
		this._action = action;

		if (!organisation) {
			throw new Error('OrganisationsActionAuthVisitor - Services cannot be null or undefined');
		}

		if (!organisation.id) {
			throw new Error('OrganisationsActionAuthVisitor - Organisation ID cannot be null or undefined');
		}
	}

	public visitAnonymous(_anonymousGroup: AnonymousAuthGroup): void {}

	public visitCitizen(_citizenGroup: CitizenAuthGroup): void {}

	public visitOrganisationAdmin(_userGroup: OrganisationAdminAuthGroup): void {
		const organisationId = this._organisation.id;
		if (_userGroup.hasOrganisationId(organisationId)) {
			this.markWithPermission();
		}
	}

	public visitServiceAdmin(_userGroup: ServiceAdminAuthGroup): void {
		const organisationId = this._organisation.id;
		switch (this._action) {
			case CrudAction.Read:
				if (_userGroup.authorisedServices.find((service) => service.organisation.id === organisationId)) {
					this.markWithPermission();
				}
				return;
			default:
				return;
		}
	}

	public visitServiceProvider(_userGroup: ServiceProviderAuthGroup): void {}
}
