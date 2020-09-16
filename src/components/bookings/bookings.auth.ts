import { Booking, ChangeLogAction } from '../../models';
import {
	AuthGroup,
	CitizenAuthGroup,
	IAuthGroupVisitor,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../../infrastructure/auth/authGroup';
import { QueryAuthGroupVisitor } from '../../infrastructure/auth/queryAuthGroupVisitor';

export class BookingActionAuthVisitor implements IAuthGroupVisitor {
	private _booking: Booking;
	private _changeLogAction: ChangeLogAction;
	private _hasPermission: boolean;

	constructor(booking: Booking, changeLogAction: ChangeLogAction) {
		if (!booking) {
			throw new Error('BookingActionAuthVisitor - Booking cannot be null');
		}

		this._booking = booking;
		this._changeLogAction = changeLogAction;
		this._hasPermission = false;
	}

	private markWithPermission(): void {
		// if any role has permission the result will be true.
		this._hasPermission = true;
	}

	public visitCitizen(_citizenGroup: CitizenAuthGroup): void {
		const uinFin = _citizenGroup.user.singPassUser.UinFin;
		if (this._booking.citizenUinFin === uinFin) {
			switch (this._changeLogAction) {
				case ChangeLogAction.Create:
				case ChangeLogAction.Update:
				case ChangeLogAction.Reschedule:
				case ChangeLogAction.Cancel:
					this.markWithPermission();
			}
		}
	}

	public visitServiceAdmin(_userGroup: ServiceAdminAuthGroup): void {
		const serviceId = this._booking.serviceId || this._booking.service?.id;
		if (_userGroup.hasServiceId(serviceId)) {
			this.markWithPermission();
		}
	}

	public visitServiceProvider(_userGroup: ServiceProviderAuthGroup): void {
		const serviceProviderId = this._booking.serviceProviderId || this._booking.serviceProvider?.id;
		// tslint:disable-next-line: tsr-detect-possible-timing-attacks
		if (_userGroup.authorisedServiceProvider.id === serviceProviderId) {
			this.markWithPermission();
		}
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
		const authorisedUinFin = _citizenGroup.user.singPassUser.UinFin;
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
