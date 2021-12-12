import {
	PermissionAwareAuthGroupVisitor,
	QueryAuthGroupVisitor,
} from '../../infrastructure/auth/queryAuthGroupVisitor';
import { Event } from '../../models/entities/event';
import {
	AnonymousAuthGroup,
	CitizenAuthGroup,
	OrganisationAdminAuthGroup,
	OtpAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../../infrastructure/auth/authGroup';

export class EventQueryAuthVisitor extends QueryAuthGroupVisitor {
	private readonly serviceProviderAlias: string;
	private readonly serviceProviderServiceAlias: string;

	constructor(serviceProviderAlias: string, serviceProviderServiceAlias: string) {
		super();

		this.serviceProviderAlias = serviceProviderAlias;
		this.serviceProviderServiceAlias = serviceProviderServiceAlias;
	}

	public visitOtp(_otpGroup: OtpAuthGroup): void {
		this.addAsTrue();
	}

	public visitAnonymous(_anonymousGroup: AnonymousAuthGroup): void {
		this.addAsTrue();
	}

	public visitCitizen(_citizenGroup: CitizenAuthGroup): void {
		this.addAsTrue();
	}

	public visitOrganisationAdmin(_userGroup: OrganisationAdminAuthGroup): void {
		const authorisedOrganisationIds = _userGroup.authorisedOrganisations.map((org) => org.id);
		this.addAuthCondition(
			`${this.serviceProviderServiceAlias}._organisationId IN (:...authorisedOrganisationIds)`,
			{ authorisedOrganisationIds },
		);
	}

	public visitServiceAdmin(_userGroup: ServiceAdminAuthGroup): void {
		const authorisedServiceIds = _userGroup.authorisedServices.map((s) => s.id);
		this.addAuthCondition(`${this.serviceProviderServiceAlias}._id IN (:...authorisedServiceIds)`, {
			authorisedServiceIds,
		});
	}

	public visitServiceProvider(_userGroup: ServiceProviderAuthGroup): void {
		const authorisedServiceProviderId = _userGroup.authorisedServiceProvider.id;

		this.addAuthCondition(`${this.serviceProviderAlias}._id = :authorisedServiceProviderId`, {
			authorisedServiceProviderId,
		});
	}
}

export class EventsAuthVisitor extends PermissionAwareAuthGroupVisitor {
	private _event: Event;

	constructor(event: Event) {
		super();
		if (!event) {
			throw new Error('EventActionAuthVisitor - Event cannot be null');
		}

		if (!event.service) {
			throw new Error('EventActionAuthVisitor - Event service not loaded in memory.');
		}

		this._event = event;
	}

	visitOtp(_otpGroup: OtpAuthGroup): void {}

	visitAnonymous(_anonymousGroup: AnonymousAuthGroup): void {}

	visitCitizen(_citizenGroup: CitizenAuthGroup): void {}

	visitOrganisationAdmin(_userGroup: OrganisationAdminAuthGroup): void {
		const organisationId = this._event.service.organisationId;
		if (_userGroup.hasOrganisationId(organisationId)) {
			this.markWithPermission();
		}
	}

	visitServiceAdmin(_userGroup: ServiceAdminAuthGroup): void {
		const serviceId = this._event.serviceId;
		if (_userGroup.hasServiceId(serviceId)) {
			this.markWithPermission();
		}
	}

	visitServiceProvider(_userGroup: ServiceProviderAuthGroup): void {}
}
