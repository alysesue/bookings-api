export type UserConditionParams = { userCondition: string; userParams: {} };

export class AuthConditionCollection {
	private _authConditions: string[];
	private _authParams: {};
	private _addAsTrue: boolean;

	constructor() {
		this._authConditions = [];
		this._authParams = {};
		this._addAsTrue = false;
	}

	public addAsTrue(): void {
		this._addAsTrue = true;
	}

	public addAuthCondition(condition: string, params: {}): void {
		const conditionTrim = condition?.trim();
		if (conditionTrim) {
			this._authConditions.push(conditionTrim);
			this._authParams = { ...this._authParams, ...params };
		}
	}

	public getVisibilityCondition(): UserConditionParams {
		if (this._addAsTrue) {
			// the result of any OR condition with true will be true, so no filter is returned.
			return {
				userCondition: '',
				userParams: {},
			};
		}

		if (this._authConditions.length === 0) {
			// returns false in case user has no permission.
			return {
				userCondition: `FALSE`,
				userParams: {},
			};
		}

		let joinedCondition = this._authConditions.map((c) => `(${c})`).join(' OR ');
		if (this._authConditions.length > 1) {
			joinedCondition = `(${joinedCondition})`;
		}

		return {
			userCondition: joinedCondition,
			userParams: this._authParams,
		};
	}
}
