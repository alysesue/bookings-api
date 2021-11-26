import { Booking, BookingStatus, ChangeLogAction } from '../../models';
import {
	AnonymousAuthGroup,
	AuthGroup,
	CitizenAuthGroup,
	OrganisationAdminAuthGroup,
	OtpAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../../infrastructure/auth/authGroup';
import {
	PermissionAwareAuthGroupVisitor,
	QueryAuthGroupVisitor,
} from '../../infrastructure/auth/queryAuthGroupVisitor';
import { UserConditionParams } from '../../infrastructure/auth/authConditionCollection';
import { CitizenAuthenticationType } from '../../models/citizenAuthenticationType';
import { orWhere } from '../../tools/queryConditions';

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

	private isValidOTPServiceAndUser(_anonymousGroup: AnonymousAuthGroup) {
		const service = this._booking.service;

		return service.hasCitizenAuthentication(CitizenAuthenticationType.Otp) && _anonymousGroup.hasOTPUser();
	}

	public visitOtp(_otpGroup: OtpAuthGroup): void {
		const userId = _otpGroup.user.id;

		// tslint:disable-next-line: no-small-switch
		switch (this._changeLogAction) {
			case ChangeLogAction.Create:
				if (
					this._booking.status === BookingStatus.OnHold ||
					this._booking.service.hasCitizenAuthentication(CitizenAuthenticationType.Otp)
				) {
					this.markWithPermission();
				}

				break;
			case ChangeLogAction.Update:
			case ChangeLogAction.Reschedule:
			case ChangeLogAction.Cancel:
				if ((this._booking.creatorId = userId)) {
					// REVIEW TO BE CHANGED TO OWNER ID
					this.markWithPermission();
				}
				break;
		}
	}

	// TO REVIEW PERMISSION
	public visitAnonymous(_anonymousGroup: AnonymousAuthGroup): void {
		const userId = _anonymousGroup.user.id;

		// tslint:disable-next-line: no-small-switch
		switch (this._changeLogAction) {
			case ChangeLogAction.Create:
				if (this._booking.status === BookingStatus.OnHold || this.isValidOTPServiceAndUser(_anonymousGroup)) {
					this.markWithPermission();
				}

				break;
			case ChangeLogAction.Update:
			case ChangeLogAction.Reschedule:
			case ChangeLogAction.Cancel:
				if (
					_anonymousGroup.hasOTPUser() &&
					_anonymousGroup.user.anonymousUser.bookingUUID === this._booking._uuid
				) {
					this.markWithPermission();
					break;
				}

				if (this.isValidOTPServiceAndUser(_anonymousGroup)) {
					if (
						(this._booking.createdLog && _anonymousGroup.user.id === this._booking.createdLog.userId) ||
						this._booking.creatorId === userId
					) {
						this.markWithPermission();
						break;
					}
				}
				break;
		}
	}

	public visitCitizen(_citizenGroup: CitizenAuthGroup): void {
		const service = this._booking.service;
		if (!service.hasCitizenAuthentication(CitizenAuthenticationType.Singpass)) {
			return;
		}

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

	constructor(alias: string, serviceAlias: string) {
		super();
		this._alias = alias;
		this._serviceAlias = serviceAlias;
	}

	// REVIEW TO BE CHANGE TO OWNER ID
	public visitOtp(_otpGroup: OtpAuthGroup): void {
		const orConditions = [];
		const orParams = {};
		orParams['otpUserId'] = _otpGroup.user.id;
		orConditions.push(`${this._alias}."_creatorId" = :otpUserId`);

		this.addAuthCondition(orWhere(orConditions), orParams);
	}

	// TO REVIEW PERMISSION
	public visitAnonymous(_anonymousGroup: AnonymousAuthGroup): void {
		const orConditions = [];
		const orParams = {};
		orParams['anonUserId'] = _anonymousGroup.user.id;
		orConditions.push(`${this._alias}."_creatorId" = :anonUserId`);

		if (_anonymousGroup.bookingInfo) {
			orParams['authorisedBookingUUID'] = _anonymousGroup.bookingInfo.bookingUUID;
			orConditions.push(`${this._alias}."_uuid" = :authorisedBookingUUID`);
		}

		this.addAuthCondition(orWhere(orConditions), orParams);
	}

	public visitCitizen(_citizenGroup: CitizenAuthGroup): void {
		const authorisedUinFin = _citizenGroup.user.singPassUser.UinFin;
		const userId = _citizenGroup.user.id;

		this.addAuthCondition(
			`${this._alias}."_citizenUinFin" = :authorisedUinFin OR ${this._alias}."_creatorId" = :userId`,
			{
				authorisedUinFin,
				userId,
			},
		);
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
		this.addAuthCondition(
			`${this._alias}."_serviceProviderId" = :authorisedServiceProviderId AND NOT ${this._alias}."_status" = :bookingStatus`,
			{
				authorisedServiceProviderId,
				bookingStatus: BookingStatus.PendingApprovalSA,
			},
		);
	}
}

export interface IBookingQueryVisitor {
	createUserVisibilityCondition(authGroups: AuthGroup[]): Promise<UserConditionParams>;
}

class BookingQueryNoAuthVisitor implements IBookingQueryVisitor {
	public async createUserVisibilityCondition(_authGroups: AuthGroup[]): Promise<UserConditionParams> {
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
		return new BookingQueryAuthVisitor('booking', 'service_relation');
	}
}
