import { Booking, ChangeLogAction } from '../../models';
import {
	AuthGroup,
	CitizenAuthGroup,
	IAuthGroupVisitor,
	OrganisationAdminAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../../infrastructure/auth/authGroup';
import { QueryAuthGroupVisitor } from '../../infrastructure/auth/queryAuthGroupVisitor';

export class BookingActionAuthVisitor implements IAuthGroupVisitor {
	private _booking: Booking;
	private readonly _changeLogAction: ChangeLogAction;
	private _hasPermission: boolean;

	constructor(booking: Booking, changeLogAction: ChangeLogAction) {
		if (!booking) {
			throw new Error('BookingActionAuthVisitor - Booking cannot be null');
		}

		if (!booking.service) {
			throw new Error('BookingActionAuthVisitor - Booking service not loaded in memory.');
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

	public hasPermission(authGroups: AuthGroup[]): boolean {
		for (const group of authGroups) {
			group.acceptVisitor(this);
		}

		return this._hasPermission;
	}
}

export class BookingQueryAuthVisitor extends QueryAuthGroupVisitor {
	private readonly _alias: string;
	private readonly _options: BookingQueryOptions;
	private readonly _serviceAlias: string;

	constructor(alias: string, serviceAlias: string, options?: BookingQueryOptions) {
		super();
		this._alias = alias;
		this._serviceAlias = serviceAlias;
		this._options = options;
	}

	public visitCitizen(_citizenGroup: CitizenAuthGroup): void {
		this.visit(() => {
			const authorisedUinFin = _citizenGroup.user.singPassUser.UinFin;
			this.addAuthCondition(`${this._alias}."_citizenUinFin" = :authorisedUinFin`, {
				authorisedUinFin,
			});
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

	private visit(authorizedVisit: () => void): void {
		if (this.shouldNotByPassAuthCondition()) {
			authorizedVisit();
		} else {
			this.byPassBookingAuthCondition();
		}
	}

	private shouldNotByPassAuthCondition() {
		return !this._options || !this._options.includeAll || !this._options.serviceId;
	}

	private byPassBookingAuthCondition(): void {
		this.addAuthCondition(`${this._alias}."_serviceId" = :serviceId`, {
			serviceId: this._options.serviceId,
		});
	}
}

export type BookingQueryOptions = { includeAll: boolean; serviceId: number };
