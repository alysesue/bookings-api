import { iterableToArray } from '../tools/asyncIterables';
import { BusinessError } from '../errors/businessError';
import { BusinessValidation } from '../models';

export interface IValidator<T> {
	validate(booking: T): Promise<void>;
	bypassCaptcha(shouldBypassCaptcha: boolean): any;
}

export abstract class Validator<T> implements IValidator<T> {
	protected shouldBypassCaptcha = false;
	public async validate(entity: T): Promise<void> {
		const validations = await iterableToArray<BusinessValidation>(this.getValidations(entity));
		BusinessError.throw(validations);
	}

	public bypassCaptcha(shouldBypassCaptcha: boolean) {
		this.shouldBypassCaptcha = shouldBypassCaptcha;
	}

	protected async *getValidations(_entity: T): AsyncIterable<BusinessValidation> {
		return;
	}
}
