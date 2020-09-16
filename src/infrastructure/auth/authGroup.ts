import { Service, ServiceProvider, User } from '../../models';

export abstract class AuthGroup {
	private _user: User;
	constructor(user: User) {
		this._user = user;
	}

	public get user(): User {
		return this._user;
	}

	public abstract acceptVisitor(visitor: IAuthGroupVisitor): void;
}

// Visitor Pattern
export interface IAuthGroupVisitor {
	visitCitizen(_citizenGroup: CitizenAuthGroup): void;
	visitServiceAdmin(_userGroup: ServiceAdminAuthGroup): void;
	visitServiceProvider(_userGroup: ServiceProviderAuthGroup): void;
}

export class CitizenAuthGroup extends AuthGroup {
	constructor(citizenUser: User) {
		super(citizenUser);

		if (!citizenUser.isCitizen()) {
			throw new Error('CitizenAuthGroup must be created with a citizen User.');
		}
	}

	public acceptVisitor(visitor: IAuthGroupVisitor): void {
		visitor.visitCitizen(this);
	}
}

export class ServiceAdminAuthGroup extends AuthGroup {
	private _authorisedServices: Service[];

	constructor(user: User, services: Service[]) {
		super(user);
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

	public acceptVisitor(visitor: IAuthGroupVisitor): void {
		visitor.visitServiceAdmin(this);
	}
}

export class ServiceProviderAuthGroup extends AuthGroup {
	private _authorisedServiceProvider: ServiceProvider;

	constructor(user: User, serviceProvider: ServiceProvider) {
		super(user);
		if (!serviceProvider) {
			throw new Error('Service provider is required in ServiceProviderUserGroup.');
		}

		this._authorisedServiceProvider = serviceProvider;
	}

	public get authorisedServiceProvider(): ServiceProvider {
		return this._authorisedServiceProvider;
	}

	public acceptVisitor(visitor: IAuthGroupVisitor): void {
		visitor.visitServiceProvider(this);
	}
}
