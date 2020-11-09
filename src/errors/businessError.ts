import { BusinessValidation } from '../models';

export class BusinessError extends Error {
	private _validations: BusinessValidation[];

	private constructor(validations: BusinessValidation[]) {
		const errorMsg = validations.map((v) => v.toString()).join(', ');
		super(errorMsg);
		Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
		this.name = BusinessError.name;
		this._validations = validations;
	}

	public get validations(): BusinessValidation[] {
		return this._validations;
	}

	public static create(validations: BusinessValidation[]): BusinessError {
		if (!validations || validations.length === 0) return undefined;
		return new BusinessError(validations);
	}

	public static throw(validations: BusinessValidation[]): void {
		const error = BusinessError.create(validations);
		if (error) throw error;
	}
}
