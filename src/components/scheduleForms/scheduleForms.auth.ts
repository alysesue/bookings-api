// tslint:disable: tsr-detect-possible-timing-attacks
import {
	AnonymousAuthGroup,
	CitizenAuthGroup,
	OrganisationAdminAuthGroup,
	OtpAuthGroup,
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
			throw new Error('ScheduleFormsActionAuthVisitor - Service Provider cannot be null.');
		}
		if (serviceProvider && !serviceProvider.service) {
			throw new Error('ScheduleFormsActionAuthVisitor - Service is not loaded in Service Provider.');
		}

		this._action = action;
		this._serviceProvider = serviceProvider;
	}

	public visitOtp(_otpGroup: OtpAuthGroup): void {}

	public visitAnonymous(_anonymousGroup: AnonymousAuthGroup): void {}

	public visitCitizen(_citizenGroup: CitizenAuthGroup): void {}

	public visitOrganisationAdmin(_userGroup: OrganisationAdminAuthGroup): void {
		const organisationId = this._serviceProvider.service.organisationId;
		switch (this._action) {
			case CrudAction.Create:
			case CrudAction.Read:
			case CrudAction.Update:
				if (_userGroup.hasOrganisationId(organisationId)) {
					this.markWithPermission();
				}
				return;
			default:
				return;
		}
	}

	public visitServiceAdmin(_userGroup: ServiceAdminAuthGroup): void {
		const serviceId = this._serviceProvider.serviceId;
		switch (this._action) {
			case CrudAction.Create:
			case CrudAction.Read:
			case CrudAction.Update:
				if (_userGroup.hasServiceId(serviceId)) {
					this.markWithPermission();
				}
				return;
			default:
				return;
		}
	}
	public visitServiceProvider(_userGroup: ServiceProviderAuthGroup): void {
		const serviceProviderId = this._serviceProvider.id;
		switch (this._action) {
			case CrudAction.Create:
			case CrudAction.Read:
			case CrudAction.Update:
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
	private readonly _spServiceAlias: string;

	constructor(spServiceAlias: string, serviceProviderAlias: string) {
		super();
		this._spServiceAlias = spServiceAlias;
		this._serviceProviderAlias = serviceProviderAlias;
	}

	public visitOtp(_otpGroup: OtpAuthGroup): void {}

	public visitAnonymous(_anonymousGroup: AnonymousAuthGroup): void {}

	public visitCitizen(_citizenGroup: CitizenAuthGroup): void {}

	public visitOrganisationAdmin(_userGroup: OrganisationAdminAuthGroup): void {
		const authorisedOrgIds = _userGroup.authorisedOrganisations.map((org) => org.id);
		this.addAuthCondition(`${this._spServiceAlias}._organisationId IN (:...authorisedOrgIds)`, {
			authorisedOrgIds,
		});
	}

	public visitServiceAdmin(_userGroup: ServiceAdminAuthGroup): void {
		const authorisedServiceIds = _userGroup.authorisedServices.map((s) => s.id);
		this.addAuthCondition(`${this._spServiceAlias}._id IN (:...authorisedServiceIds)`, { authorisedServiceIds });
	}

	public visitServiceProvider(_userGroup: ServiceProviderAuthGroup): void {
		const authorisedSpId = _userGroup.authorisedServiceProvider.id;
		const authorisedSpServiceId = _userGroup.authorisedServiceProvider.serviceId;
		this.addAuthCondition(
			`${this._serviceProviderAlias}._id = :authorisedSpId OR ${this._spServiceAlias}._id = :authorisedSpServiceId`,
			{ authorisedSpId, authorisedSpServiceId },
		);
	}
}
