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

	constructor(service: Service, action: CrudAction) {
		super();
		this._service = service;

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

	public visitServiceAdmin(_userGroup: ServiceAdminAuthGroup): void {}

	public visitOrganisationAdmin(_userGroup: OrganisationAdminAuthGroup): void {
		const organisationId = this._service.organisationId;
		if (_userGroup.hasOrganisationId(organisationId)) {
			this.markWithPermission();
		}
	}
}

export class NotificationTemplateQueryAuthVisitor extends QueryAuthGroupVisitor {
	private readonly _serviceAlias: string;

	constructor(alias: string, serviceAlias: string) {
		super();
		this._serviceAlias = serviceAlias;
	}

	public visitAnonymous(_anonymousGroup: AnonymousAuthGroup): void {}

	public visitCitizen(_citizenGroup: CitizenAuthGroup): void {}

	public visitServiceProvider(_userGroup: ServiceProviderAuthGroup): void {}

	public visitServiceAdmin(_userGroup: ServiceAdminAuthGroup): void {}

	public visitOrganisationAdmin(_userGroup: OrganisationAdminAuthGroup): void {
		const authorisedOrganisationIds = _userGroup.authorisedOrganisations.map((org) => org.id);
		this.addAuthCondition(`${this._serviceAlias}."_organisationId" IN (:...authorisedOrganisationIds)`, {
			authorisedOrganisationIds,
		});
	}
}
