import { BookingUUIDInfo, Organisation, Service, ServiceProvider, User } from '../../models';

export abstract class AuthGroup {
	private _user: User;
	constructor(user: User) {
		this._user = user;
	}

	public get user(): User {
		return this._user;
	}

	public abstract acceptVisitor(visitor: IAuthGroupVisitor): void | Promise<void>;
}

// Visitor Pattern
export interface IAuthGroupVisitor {
	visitAnonymous(_anonymousGroup: AnonymousAuthGroup): void | Promise<void>;
	visitCitizen(_citizenGroup: CitizenAuthGroup): void | Promise<void>;
	visitOrganisationAdmin(_userGroup: OrganisationAdminAuthGroup): void | Promise<void>;
	visitServiceAdmin(_userGroup: ServiceAdminAuthGroup): void | Promise<void>;
	visitServiceProvider(_userGroup: ServiceProviderAuthGroup): void | Promise<void>;
}

export type OtpGroupInfo = { mobileNo: string };

export class AnonymousAuthGroup extends AuthGroup {
	constructor(user: User, bookingInfo?: BookingUUIDInfo, otpGroupInfo?: OtpGroupInfo) {
		super(user);

		if (!user.isAnonymous()) {
			throw new Error('AnonymousAuthGroup must be created with an anonymous User.');
		}

		this.bookingInfo = bookingInfo;
		this.otpGroupInfo = otpGroupInfo;
	}

	public bookingInfo?: BookingUUIDInfo;
	public otpGroupInfo?: OtpGroupInfo;

	public hasOTPUser(): boolean {
		return !!this.otpGroupInfo?.mobileNo;
	}

	public acceptVisitor(visitor: IAuthGroupVisitor): void | Promise<void> {
		return visitor.visitAnonymous(this);
	}
}

export class CitizenAuthGroup extends AuthGroup {
	constructor(citizenUser: User) {
		super(citizenUser);

		if (!citizenUser.isSingPass()) {
			throw new Error('CitizenAuthGroup must be created with a citizen User.');
		}
	}

	public acceptVisitor(visitor: IAuthGroupVisitor): void | Promise<void> {
		return visitor.visitCitizen(this);
	}
}

export class OrganisationAdminAuthGroup extends AuthGroup {
	private _authorisedOrganisations: Organisation[];

	constructor(user: User, organisations: Organisation[]) {
		super(user);
		if (!user.isAdmin() && !user.isAgency()) {
			throw new Error('OrganisationAdminAuthGroup must be created with an admin or agency User.');
		}
		if (!organisations || organisations.length === 0) {
			throw new Error('At least one organisation is required in OrganisationAdminAuthGroup.');
		}

		this._authorisedOrganisations = organisations;
		this._authorisedOrganisations.sort((a, b) => a.id - b.id);
	}

	public get authorisedOrganisations(): Organisation[] {
		return this._authorisedOrganisations;
	}

	public hasOrganisationId(organisationId: number): boolean {
		if (organisationId) return this._authorisedOrganisations.some((org) => org.id === organisationId);
		return false;
	}

	public acceptVisitor(visitor: IAuthGroupVisitor): void | Promise<void> {
		return visitor.visitOrganisationAdmin(this);
	}
}

export class ServiceAdminAuthGroup extends AuthGroup {
	private readonly _authorisedServices: Service[];

	constructor(user: User, services: Service[]) {
		super(user);
		if (!user.isAdmin()) {
			throw new Error('ServiceAdminAuthGroup must be created with an admin User.');
		}
		if (!services || services.length === 0) {
			throw new Error('At least one service is required in ServiceAdminUserGroup.');
		}

		this._authorisedServices = services;
	}

	public get authorisedServices(): Service[] {
		return this._authorisedServices;
	}

	public hasServiceId(serviceId: number): boolean {
		return this._authorisedServices.findIndex((s) => s.id === serviceId) >= 0;
	}

	public acceptVisitor(visitor: IAuthGroupVisitor): void | Promise<void> {
		return visitor.visitServiceAdmin(this);
	}
}

export class ServiceProviderAuthGroup extends AuthGroup {
	private _authorisedServiceProvider: ServiceProvider;

	constructor(user: User, serviceProvider: ServiceProvider) {
		super(user);
		if (!(user.isAdmin() || user.isAgency())) {
			throw new Error('ServiceProviderAuthGroup must be created with an admin User.');
		}
		if (!serviceProvider) {
			throw new Error('Service provider is required in ServiceProviderUserGroup.');
		}

		this._authorisedServiceProvider = serviceProvider;
	}

	public get authorisedServiceProvider(): ServiceProvider {
		return this._authorisedServiceProvider;
	}

	public acceptVisitor(visitor: IAuthGroupVisitor): void | Promise<void> {
		return visitor.visitServiceProvider(this);
	}
}
