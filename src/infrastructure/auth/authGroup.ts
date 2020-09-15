import { Service, ServiceProvider, User } from '../../models';

export abstract class AuthGroup {
	public abstract acceptVisitor(visitor: IAuthGroupVisitor): void;
}

// Visitor Pattern
export interface IAuthGroupVisitor {
	visitCitizen(_citizenGroup: CitizenAuthGroup): void;
	visitServiceAdmin(_userGroup: ServiceAdminAuthGroup): void;
	visitServiceProvider(_userGroup: ServiceProviderAuthGroup): void;
}

export class CitizenAuthGroup extends AuthGroup {
	private _citizenUser: User;

	constructor(citizenUser: User) {
		super();
		if (!citizenUser.isCitizen()) {
			throw new Error('CitizenAuthGroup must be created with a citizen User.');
		}

		this._citizenUser = citizenUser;
	}

	public get citizenUser(): User {
		return this._citizenUser;
	}

	public acceptVisitor(visitor: IAuthGroupVisitor): void {
		visitor.visitCitizen(this);
	}
}

export class ServiceAdminAuthGroup extends AuthGroup {
	private _authorisedServices: Service[];

	constructor(services: Service[]) {
		super();
		if (!services || services.length === 0) {
			throw new Error('At least one service is required in ServiceAdminUserGroup.');
		}

		this._authorisedServices = services;
	}

	public get authorisedServices(): Service[] {
		return this._authorisedServices;
	}

	public acceptVisitor(visitor: IAuthGroupVisitor): void {
		visitor.visitServiceAdmin(this);
	}
}

export class ServiceProviderAuthGroup extends AuthGroup {
	private _authorisedServiceProvider: ServiceProvider;

	constructor(serviceProvider: ServiceProvider) {
		super();
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
