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

export class TimeslotItemsActionAuthVisitor implements IAuthGroupVisitor {

	private _timeslotSchedule: TimeslotsSchedule;
	private _hasPermission: boolean;
	constructor(timeslotSchedule: TimeslotsSchedule) {
		if (!timeslotSchedule) {
			throw new Error('TimeslotItemsActionAuthVisitor - Timeslot Schedule cannot be null.');
		}
		if (!timeslotSchedule.service && !timeslotSchedule.serviceProvider) {
			throw new Error(
				'TimeslotItemsActionAuthVisitor - Timeslot Schedule does not belong to any service nor service provider.',
			);
		}
		if (timeslotSchedule.serviceProvider && !timeslotSchedule.serviceProvider.service) {
			throw new Error(
				'TimeslotItemsActionAuthVisitor - Service is not loaded in Service Provider.',
			);
		}


		this._timeslotSchedule = timeslotSchedule;
		this._hasPermission = false;
	}

	public hasPermission(authGroups: AuthGroup[]): boolean {
		for (const group of authGroups) {
			group.acceptVisitor(this);
		}
		return this._hasPermission;
	}

	private markWithPermission(): void {
		// if any role has permission the result will be true.
		this._hasPermission = true;
	}

	public visitCitizen(_citizenGroup: CitizenAuthGroup): void { }

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
		} else if (this._timeslotSchedule._serviceProvider) {
			if (_userGroup.hasServiceId(this._timeslotSchedule._serviceProvider.serviceId)) {
				this.markWithPermission();
			}
		}
	}
	public visitServiceProvider(_userGroup: ServiceProviderAuthGroup): void {
		if (this._timeslotSchedule._serviceProvider &&
			_userGroup.authorisedServiceProvider.id === this._timeslotSchedule._serviceProvider.id) {
			this.markWithPermission();
		}
	}
}
