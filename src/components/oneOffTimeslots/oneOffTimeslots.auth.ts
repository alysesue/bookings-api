// tslint:disable: tsr-detect-possible-timing-attacks
import {
	AnonymousAuthGroup,
	CitizenAuthGroup,
	OrganisationAdminAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../../infrastructure/auth/authGroup';
import { OneOffTimeslot } from '../../models';
import {
	PermissionAwareAuthGroupVisitor,
	QueryAuthGroupVisitor,
} from '../../infrastructure/auth/queryAuthGroupVisitor';

export class OneOffTimeslotsQueryAuthVisitor extends QueryAuthGroupVisitor {
	private readonly serviceProviderAlias: string;
	private readonly serviceProviderServiceAlias: string;

	constructor(serviceProviderAlias: string, serviceProviderServiceAlias: string) {
		super();

		this.serviceProviderAlias = serviceProviderAlias;
		this.serviceProviderServiceAlias = serviceProviderServiceAlias;
	}

	public visitAnonymous(_anonymousGroup: AnonymousAuthGroup): void {}

	public visitCitizen(_citizenGroup: CitizenAuthGroup): void {}

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

export class OneOffTimeslotsActionAuthVisitor extends PermissionAwareAuthGroupVisitor {
	private _oneOffTimeslot: OneOffTimeslot;

	constructor(oneOffTimeslot: OneOffTimeslot) {
		super();
		if (!oneOffTimeslot) {
			throw new Error('OneOffTimeslotsActionAuthVisitor - OneOffTimeslot cannot be null.');
		}

		if (!oneOffTimeslot.serviceProvider) {
			throw new Error('OneOffTimeslotsActionAuthVisitor - Service provider not loaded.');
		}

		if (!oneOffTimeslot.serviceProvider.service) {
			throw new Error('OneOffTimeslotsActionAuthVisitor - Service not loaded.');
		}

		this._oneOffTimeslot = oneOffTimeslot;
	}

	public visitAnonymous(_anonymousGroup: AnonymousAuthGroup): void {}

	public visitCitizen(_citizenGroup: CitizenAuthGroup): void {}

	public visitOrganisationAdmin(_userGroup: OrganisationAdminAuthGroup): void {
		const organisationId = this._oneOffTimeslot.serviceProvider.service.organisationId;
		if (_userGroup.hasOrganisationId(organisationId)) {
			this.markWithPermission();
		}
	}

	public visitServiceAdmin(_userGroup: ServiceAdminAuthGroup): void {
		const serviceId = this._oneOffTimeslot.serviceProvider.serviceId;
		if (_userGroup.hasServiceId(serviceId)) {
			this.markWithPermission();
		}
	}

	public visitServiceProvider(_userGroup: ServiceProviderAuthGroup): void {
		const serviceProviderId = this._oneOffTimeslot.serviceProviderId;
		// tslint:disable-next-line: tsr-detect-possible-timing-attacks
		if (_userGroup.authorisedServiceProvider.id === serviceProviderId) {
			this.markWithPermission();
		}
	}
}
