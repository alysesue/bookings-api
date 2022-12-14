// tslint:disable: tsr-detect-possible-timing-attacks
import {
	AnonymousAuthGroup,
	CitizenAuthGroup,
	OrganisationAdminAuthGroup,
	OtpAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../../infrastructure/auth/authGroup';
import { TimeslotsSchedule } from '../../models';
import {
	PermissionAwareAuthGroupVisitor,
	QueryAuthGroupVisitor,
} from '../../infrastructure/auth/queryAuthGroupVisitor';

export class TimeslotItemsQueryAuthVisitor extends QueryAuthGroupVisitor {
	private readonly serviceAlias: string;
	private readonly serviceProviderAlias: string;
	private readonly serviceProviderServiceAlias: string;

	constructor(serviceAlias: string, serviceProviderAlias: string, serviceProviderServiceAlias: string) {
		super();

		this.serviceAlias = serviceAlias;
		this.serviceProviderAlias = serviceProviderAlias;
		this.serviceProviderServiceAlias = serviceProviderServiceAlias;
	}

	public visitOtp(_otpGroup: OtpAuthGroup): void {}

	public visitAnonymous(_anonymousGroup: AnonymousAuthGroup): void {}

	public visitCitizen(_citizenGroup: CitizenAuthGroup): void {}

	public visitOrganisationAdmin(_userGroup: OrganisationAdminAuthGroup): void {
		const orgIds = _userGroup.authorisedOrganisations.map((org) => org.id);
		this.addAuthCondition(
			`${this.serviceAlias}._organisationId IN (:...orgIds) OR ${this.serviceProviderServiceAlias}._organisationId IN (:...orgIds)`,
			{ orgIds },
		);
	}

	public visitServiceAdmin(_userGroup: ServiceAdminAuthGroup): void {
		const serviceIds = _userGroup.authorisedServices.map((s) => s.id);
		this.addAuthCondition(
			`${this.serviceAlias}._id IN (:...serviceIds) OR ${this.serviceProviderServiceAlias}._id IN (:...serviceIds)`,
			{ serviceIds },
		);
	}

	public visitServiceProvider(_userGroup: ServiceProviderAuthGroup): void {
		const serviceProviderId = _userGroup.authorisedServiceProvider.id;
		const serviceId = _userGroup.authorisedServiceProvider.serviceId;

		this.addAuthCondition(
			`${this.serviceAlias}._id = :serviceId OR ${this.serviceProviderAlias}._id = :serviceProviderId`,
			{ serviceId, serviceProviderId },
		);
	}
}

export class TimeslotItemsActionAuthVisitor extends PermissionAwareAuthGroupVisitor {
	private _timeslotSchedule: TimeslotsSchedule;
	constructor(timeslotSchedule: TimeslotsSchedule) {
		super();
		if (!timeslotSchedule) {
			throw new Error('TimeslotItemsActionAuthVisitor - Timeslot Schedule cannot be null.');
		}
		if (!timeslotSchedule.service && !timeslotSchedule.serviceProvider) {
			throw new Error(
				'TimeslotItemsActionAuthVisitor - Timeslot Schedule does not belong to any service nor service provider.',
			);
		}
		if (timeslotSchedule.serviceProvider && !timeslotSchedule.serviceProvider.service) {
			throw new Error('TimeslotItemsActionAuthVisitor - Service is not loaded in Service Provider.');
		}

		this._timeslotSchedule = timeslotSchedule;
	}

	public visitOtp(_otpGroup: OtpAuthGroup): void {}

	public visitAnonymous(_anonymousGroup: AnonymousAuthGroup): void {}

	public visitCitizen(_citizenGroup: CitizenAuthGroup): void {}

	public visitOrganisationAdmin(_userGroup: OrganisationAdminAuthGroup): void {
		if (this._timeslotSchedule._service) {
			if (_userGroup.hasOrganisationId(this._timeslotSchedule._service.organisationId)) {
				this.markWithPermission();
			}
		} else if (this._timeslotSchedule._serviceProvider) {
			const serviceProvider = this._timeslotSchedule._serviceProvider;
			if (_userGroup.hasOrganisationId(serviceProvider.service.organisationId)) {
				this.markWithPermission();
			}
		}
	}

	public visitServiceAdmin(_userGroup: ServiceAdminAuthGroup): void {
		if (this._timeslotSchedule._service && _userGroup.hasServiceId(this._timeslotSchedule._service.id)) {
			this.markWithPermission();
		} else if (
			this._timeslotSchedule._serviceProvider &&
			_userGroup.hasServiceId(this._timeslotSchedule._serviceProvider.serviceId)
		) {
			this.markWithPermission();
		}
	}
	public visitServiceProvider(_userGroup: ServiceProviderAuthGroup): void {
		if (
			this._timeslotSchedule._serviceProvider &&
			_userGroup.authorisedServiceProvider.id === this._timeslotSchedule._serviceProvider.id
		) {
			this.markWithPermission();
		}
	}
}
