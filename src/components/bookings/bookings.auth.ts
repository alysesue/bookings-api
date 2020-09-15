import { ChangeLogAction } from '../../models';
import {
	AuthGroup,
	CitizenAuthGroup,
	IAuthGroupVisitor,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../../infrastructure/auth/authGroup';
import { QueryAuthGroupVisitor } from '../../infrastructure/auth/queryAuthGroupVisitor';

export class BookingActionAuthVisitor implements IAuthGroupVisitor {
	private _changeLogAction: ChangeLogAction;
	private _hasPermission: boolean;

	constructor(changeLogAction: ChangeLogAction) {
		this._changeLogAction = changeLogAction;
		this._hasPermission = false;
	}

	private aggregatePermission(hasPermission: boolean): void {
		// if any role has permission the result will be true.
		this._hasPermission = this._hasPermission || hasPermission;
	}

	public visitCitizen(_citizenGroup: CitizenAuthGroup): void {
		switch (this._changeLogAction) {
			case ChangeLogAction.Create:
			case ChangeLogAction.Update:
			case ChangeLogAction.Reschedule:
			case ChangeLogAction.Cancel:
				this.aggregatePermission(true);
		}
	}

	public visitServiceAdmin(_userGroup: ServiceAdminAuthGroup): void {
		this.aggregatePermission(true);
	}

	public visitServiceProvider(_userGroup: ServiceProviderAuthGroup): void {
		this.aggregatePermission(true);
	}

	public hasPermission(authGroups: AuthGroup[]): boolean {
		for (const group of authGroups) {
			group.acceptVisitor(this);
		}

		return this._hasPermission;
	}
}

export class BookingQueryAuthVisitor extends QueryAuthGroupVisitor {
	private _alias: string;

	constructor(alias: string) {
		super();
		this._alias = alias;
	}

	public visitCitizen(_citizenGroup: CitizenAuthGroup): void {
		const authorisedUinFin = _citizenGroup.citizenUser.singPassUser.UinFin;
		this.addAuthCondition(`${this._alias}."_citizenUinFin" = :authorisedUinFin`, {
			authorisedUinFin,
		});
	}

	public visitServiceProvider(_userGroup: ServiceProviderAuthGroup): void {
		const authorisedServiceProviderId = _userGroup.authorisedServiceProvider.id;
		this.addAuthCondition(`${this._alias}."_serviceProviderId" = :authorisedServiceProviderId`, {
			authorisedServiceProviderId,
		});
	}

	public visitServiceAdmin(_userGroup: ServiceAdminAuthGroup): void {
		const authorisedBookingServiceIds = _userGroup.authorisedServices.map((s) => s.id);
		if (authorisedBookingServiceIds.length > 0) {
			this.addAuthCondition(`${this._alias}."_serviceId" IN (:...authorisedBookingServiceIds)`, {
				authorisedBookingServiceIds,
			});
		}
	}
}
