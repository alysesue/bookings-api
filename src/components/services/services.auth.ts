import {
	AnonymousAuthGroup,
	CitizenAuthGroup,
	OrganisationAdminAuthGroup,
	OtpAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../../infrastructure/auth/authGroup';
import {
	PermissionAwareAuthGroupVisitor,
	QueryAuthGroupVisitor,
} from '../../infrastructure/auth/queryAuthGroupVisitor';
import { Service } from '../../models';
import { CrudAction } from '../../enums/crudAction';

export class ServicesActionAuthVisitor extends PermissionAwareAuthGroupVisitor {
	private readonly _service: Service;
	private readonly _action: CrudAction;

	constructor(service: Service, action: CrudAction) {
		super();
		this._service = service;
		this._action = action;

		if (!service) {
			throw new Error('ServicesActionAuthVisitor - Services cannot be null or undefined');
		}

		if (!service.organisationId) {
			throw new Error('ServicesActionAuthVisitor - Organisation ID cannot be null or undefined');
		}
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
			case CrudAction.Create:
			case CrudAction.Delete:
				return;
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

export class ServicesQueryAuthVisitor extends QueryAuthGroupVisitor {
	private _alias: string;

	constructor(alias: string) {
		super();
		this._alias = alias;
	}

	public visitOtp(_otpGroup: OtpAuthGroup): void {
		this.addAsTrue();
	}

	// TO REVIEW
	public visitAnonymous(_anonymousGroup: AnonymousAuthGroup): void {
		if (_anonymousGroup.bookingInfo) {
			const { serviceId } = _anonymousGroup.bookingInfo;
			this.addAuthCondition(`${this._alias}."_id" = :serviceId`, { serviceId });
		} else {
			this.addAsTrue();
		}
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
