export type UserConditionParams = { userCondition: string; userParams: {} };

export class AuthConditionCollection {
	private _authConditions: string[];
	private _authParams: {};

	constructor() {
		this._authConditions = [];
		this._authParams = {};
	}

	public addAuthCondition(condition: string, params: {}): void {
		const conditionTrim = condition?.trim();
		if (conditionTrim) {
			this._authConditions.push(conditionTrim);
			this._authParams = { ...this._authParams, ...params };
		}
	}

	public getVisibilityCondition(): UserConditionParams {
		if (this._authConditions.length === 0) {
			// returns false in case user has no groups.
			return {
				userCondition: `FALSE`,
				userParams: {},
			};
		}

		const joinedCondition = this._authConditions.map((c) => `(${c})`).join(' OR ');

		return {
			userCondition: `(${joinedCondition})`,
			userParams: this._authParams,
		};
	}
}
