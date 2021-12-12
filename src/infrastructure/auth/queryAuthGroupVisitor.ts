import { AuthConditionCollection, UserConditionParams } from './authConditionCollection';
import {
	AnonymousAuthGroup,
	AuthGroup,
	CitizenAuthGroup,
	IAuthGroupVisitor,
	OrganisationAdminAuthGroup,
	OtpAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from './authGroup';

export abstract class QueryAuthGroupVisitor implements IAuthGroupVisitor {
	private _conditions: AuthConditionCollection;

	protected constructor() {
		this._conditions = new AuthConditionCollection();
	}

	protected addAsTrue(): void {
		this._conditions.addAsTrue();
	}

	protected addAuthCondition(condition: string, params: {}): void {
		this._conditions.addAuthCondition(condition, params);
	}

	protected getVisibilityCondition(): UserConditionParams {
		return this._conditions.getVisibilityCondition();
	}

	public abstract visitOrganisationAdmin(_userGroup: OrganisationAdminAuthGroup): void;
	public abstract visitAnonymous(_anonymousGroup: AnonymousAuthGroup): void;
	public abstract visitOtp(_otpGroup: OtpAuthGroup): void;
	public abstract visitCitizen(_citizenGroup: CitizenAuthGroup): void;
	public abstract visitServiceAdmin(_userGroup: ServiceAdminAuthGroup): void;
	public abstract visitServiceProvider(_userGroup: ServiceProviderAuthGroup): void;

	public async createUserVisibilityCondition(authGroups: AuthGroup[]): Promise<UserConditionParams> {
		this._conditions = new AuthConditionCollection();
		for (const group of authGroups) {
			group.acceptVisitor(this);
		}

		return this.getVisibilityCondition();
	}
}

export abstract class PermissionAwareAuthGroupVisitor implements IAuthGroupVisitor {
	private _hasPermission: boolean;

	protected constructor() {
		this._hasPermission = false;
	}

	public abstract visitOrganisationAdmin(_userGroup: OrganisationAdminAuthGroup): void;
	public abstract visitAnonymous(_anonymousGroup: AnonymousAuthGroup): void;
	public abstract visitOtp(_otpGroup: OtpAuthGroup): void;
	public abstract visitCitizen(_citizenGroup: CitizenAuthGroup): void;
	public abstract visitServiceAdmin(_userGroup: ServiceAdminAuthGroup): void;
	public abstract visitServiceProvider(_userGroup: ServiceProviderAuthGroup): void;

	public hasPermission(authGroups: AuthGroup[]): boolean {
		this._hasPermission = false;
		for (const group of authGroups) {
			group.acceptVisitor(this);
		}

		return this._hasPermission;
	}

	protected markWithPermission(): void {
		// if any role has permission the result will be true.
		this._hasPermission = true;
	}
}
