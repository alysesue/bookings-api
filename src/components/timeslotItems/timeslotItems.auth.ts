import { IAuthGroupVisitor, CitizenAuthGroup, OrganisationAdminAuthGroup, ServiceAdminAuthGroup, ServiceProviderAuthGroup, AuthGroup } from "../../infrastructure/auth/authGroup";
import { ChangeLogAction, TimeslotItem, TimeslotsSchedule } from "../../models";

export class TimeslotItemsActionAuthVisitor implements IAuthGroupVisitor {
	private _timeslotItem: TimeslotItem;
	private _timeslotSchedule: TimeslotsSchedule;
	private _changeLogAction: ChangeLogAction;
	private _hasPermission: boolean;
	constructor(timeslotSchedule: TimeslotsSchedule, changeLogAction: ChangeLogAction) {
		if (!timeslotSchedule) {
			throw new Error('TimeslotItemsActionAuthVisitor - Timeslot Schedule cannot be null');
		}
		//		this._timeslotItem = timeslotItem;
		this._timeslotSchedule = timeslotSchedule;
		this._changeLogAction = changeLogAction;
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


	visitCitizen(_citizenGroup: CitizenAuthGroup): void {

	}
	visitOrganisationAdmin(_userGroup: OrganisationAdminAuthGroup): void {
	}
	visitServiceAdmin(_userGroup: ServiceAdminAuthGroup): void {
		if (_userGroup.hasServiceId(this._timeslotSchedule._service.id)) {
			this.markWithPermission();
		}
	}
	visitServiceProvider(_userGroup: ServiceProviderAuthGroup): void {
		if (_userGroup.authorisedServiceProvider.id === this._timeslotSchedule._serviceProvider.id) {
			this.markWithPermission();
		}
	}


}
