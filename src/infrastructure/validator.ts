import { iterableToArray } from '../tools/asyncIterables';
import { BusinessError } from '../errors/businessError';
import { BusinessValidation } from '../models';

export interface IValidator<T> {
	validate(booking: T): Promise<void>;
}

/**
 * This class has local mutable properties.
 * Use @Scoped(Scope.Local) in subclassess.
 * To get an instance use this.containerContext.resolve(ClassName);
 * ContainerContext can be injected via @Inject
 */
export abstract class Validator<T> implements IValidator<T> {
	public async validate(entity: T): Promise<void> {
		const validations = await iterableToArray<BusinessValidation>(this.getValidations(entity));
		BusinessError.throw(validations);
	}

	protected abstract getValidations(_entity: T): AsyncIterable<BusinessValidation>;
}
