import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { BusinessValidation } from '../businessValidation';

export abstract class AbstractEntity {
	public async *asyncValidate(): AsyncIterable<BusinessValidation> {}

	public static async validateEntities(entities: AbstractEntity[]): Promise<void> {
		const allBusinessValidation = [];
		await Promise.all(
			entities.map(async (entity) => {
				for await (const businessValidation of entity.asyncValidate()) {
					allBusinessValidation.push(businessValidation);
				}
			}),
		);
		if (allBusinessValidation.length > 0) {
			const response = allBusinessValidation.map((val) => val.message);
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setResponseData(response);
		}
	}
}
