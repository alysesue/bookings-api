// tslint:disable: tsr-detect-possible-timing-attacks
import {
	AuthGroup,
	CitizenAuthGroup,
	IAuthGroupVisitor,
	OrganisationAdminAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../../infrastructure/auth/authGroup';
import { TimeslotsSchedule } from '../../models';
import { PermissionAwareAuthGroupVisitor } from '../../infrastructure/auth/queryAuthGroupVisitor';

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
