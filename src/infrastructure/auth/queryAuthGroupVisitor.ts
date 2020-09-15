import { AuthConditionCollection, UserConditionParams } from './authConditionCollection';
import {
	AuthGroup,
	CitizenAuthGroup,
	IAuthGroupVisitor,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from './authGroup';

export abstract class QueryAuthGroupVisitor implements IAuthGroupVisitor {
	private _conditions: AuthConditionCollection;

	constructor() {
		this._conditions = new AuthConditionCollection();
	}

	protected addAuthCondition(condition: string, params: {}): void {
		this._conditions.addAuthCondition(condition, params);
	}

	protected getVisibilityCondition(): UserConditionParams {
		return this._conditions.getVisibilityCondition();
	}

	public abstract visitCitizen(_citizenGroup: CitizenAuthGroup): void;
	public abstract visitServiceAdmin(_userGroup: ServiceAdminAuthGroup): void;
	public abstract visitServiceProvider(_userGroup: ServiceProviderAuthGroup): void;

	public async createUserVisibilityCondition(authGroups: AuthGroup[]): Promise<UserConditionParams> {
		for (const group of authGroups) {
			group.acceptVisitor(this);
		}

		return this.getVisibilityCondition();
	}
}
