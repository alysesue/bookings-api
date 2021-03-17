import { Booking, ChangeLogAction } from '../../models';
import {
	AnonymousAuthGroup,
	AuthGroup,
	CitizenAuthGroup,
	OrganisationAdminAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../../infrastructure/auth/authGroup';
import {
	PermissionAwareAuthGroupVisitor,
	QueryAuthGroupVisitor,
} from '../../infrastructure/auth/queryAuthGroupVisitor';
import { UserConditionParams } from '../../infrastructure/auth/authConditionCollection';

export class BookingActionAuthVisitor extends PermissionAwareAuthGroupVisitor {
	private _booking: Booking;
	private readonly _changeLogAction: ChangeLogAction;

	constructor(booking: Booking, changeLogAction: ChangeLogAction) {
		super();
		if (!booking) {
			throw new Error('BookingActionAuthVisitor - Booking cannot be null');
		}

		if (!booking.service) {
			throw new Error('BookingActionAuthVisitor - Booking service not loaded in memory.');
		}

		this._booking = booking;
		this._changeLogAction = changeLogAction;
	}

	public visitAnonymous(_anonymousGroup: AnonymousAuthGroup): void {
		// tslint:disable-next-line: no-small-switch
		switch (this._changeLogAction) {
			case ChangeLogAction.Create:
				if (this._booking.service.allowAnonymousBookings) {
					this.markWithPermission();
				}
			case ChangeLogAction.Update:
			case ChangeLogAction.Reschedule:
				if (this._booking.createdLog && _anonymousGroup.user.id === this._booking.createdLog.userId) {
					this.markWithPermission();
				}
		}
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

	public visitOrganisationAdmin(_userGroup: OrganisationAdminAuthGroup): void {
		const organisationId = this._booking.service.organisationId;
		if (_userGroup.hasOrganisationId(organisationId)) {
			this.markWithPermission();
		}
	}

	public visitServiceAdmin(_userGroup: ServiceAdminAuthGroup): void {
		const serviceId = this._booking.serviceId;
		if (_userGroup.hasServiceId(serviceId)) {
			this.markWithPermission();
		}
	}

	public visitServiceProvider(_userGroup: ServiceProviderAuthGroup): void {
		const serviceProviderId = this._booking.serviceProviderId;
		// tslint:disable-next-line: tsr-detect-possible-timing-attacks
		if (_userGroup.authorisedServiceProvider.id === serviceProviderId) {
			this.markWithPermission();
		}
	}
}

export class BookingQueryAuthVisitor extends QueryAuthGroupVisitor implements IBookingQueryVisitor {
	private readonly _alias: string;
	private readonly _serviceAlias: string;
	private readonly _createdLogAlias: string;

	constructor(alias: string, serviceAlias: string, createdLogAlias: string) {
		super();
		this._alias = alias;
		this._serviceAlias = serviceAlias;
		this._createdLogAlias = createdLogAlias;
	}

	public visitAnonymous(_anonymousGroup: AnonymousAuthGroup): void {
		const userId = _anonymousGroup.user.id;
		this.addAuthCondition(`${this._createdLogAlias}."_userId" = :userId`, {
			userId,
		});
	}

	public visitCitizen(_citizenGroup: CitizenAuthGroup): void {
		const authorisedUinFin = _citizenGroup.user.singPassUser.UinFin;
		this.addAuthCondition(`${this._alias}."_citizenUinFin" = :authorisedUinFin`, {
			authorisedUinFin,
		});
	}

	public visitOrganisationAdmin(_userGroup: OrganisationAdminAuthGroup): void {
		const authorisedOrganisationIds = _userGroup.authorisedOrganisations.map((org) => org.id);
		this.addAuthCondition(`${this._serviceAlias}."_organisationId" IN (:...authorisedOrganisationIds)`, {
			authorisedOrganisationIds,
		});
	}

	public visitServiceAdmin(_userGroup: ServiceAdminAuthGroup): void {
		const authorisedBookingServiceIds = _userGroup.authorisedServices.map((s) => s.id);
		this.addAuthCondition(`${this._alias}."_serviceId" IN (:...authorisedBookingServiceIds)`, {
			authorisedBookingServiceIds,
		});
	}

	public visitServiceProvider(_userGroup: ServiceProviderAuthGroup): void {
		const authorisedServiceProviderId = _userGroup.authorisedServiceProvider.id;
		this.addAuthCondition(`${this._alias}."_serviceProviderId" = :authorisedServiceProviderId`, {
			authorisedServiceProviderId,
		});
	}
}

export interface IBookingQueryVisitor {
	createUserVisibilityCondition(authGroups: AuthGroup[]): Promise<UserConditionParams>;
}

class BookingQueryNoAuthVisitor implements IBookingQueryVisitor {
	public async createUserVisibilityCondition(authGroups: AuthGroup[]): Promise<UserConditionParams> {
		return {
			userCondition: '',
			userParams: {},
		};
	}
}

export class BookingQueryVisitorFactory {
	public static getBookingQueryVisitor(byPassAuth: boolean): IBookingQueryVisitor {
		if (byPassAuth) {
			return new BookingQueryNoAuthVisitor();
		}
		return new BookingQueryAuthVisitor('booking', 'service_relation', 'createdLog');
	}
}
