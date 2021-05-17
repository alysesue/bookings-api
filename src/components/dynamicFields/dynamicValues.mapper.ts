import { BusinessValidation } from '../../models';
import { Inject, InRequestScope } from 'typescript-ioc';
import { IdHasher } from '../../infrastructure/idHasher';
import {
	DynamicValueContract,
	DynamicValueTypeContract,
	PersistDynamicValueContract,
} from './dynamicValues.apicontract';
import { DynamicValueJsonModel, DynamicValueType } from '../../models/entities/booking';
import { groupByKeyLastValue } from '../../tools/collections';
import { DynamicFieldsService } from './dynamicFields.service';
import { ErrorResult, OkResult, OptionalResult } from '../../errors';
import { DynamicValueRequestVisitor } from './dynamicValues.validation';
import { UserContext } from '../../infrastructure/auth/userContext';

export type MapRequestOptionalResult = OptionalResult<DynamicValueJsonModel[], BusinessValidation[]>;

@InRequestScope
export class DynamicValuesMapper {
	static readonly DynamicValueTypeMapping: Readonly<{ [key: string]: DynamicValueTypeContract }> = {
		[DynamicValueType.SingleSelection]: DynamicValueTypeContract.SingleSelection,
		[DynamicValueType.Text]: DynamicValueTypeContract.Text,
	};

	@Inject
	private userContext: UserContext;
	@Inject
	private dynamicFieldsService: DynamicFieldsService;
	@Inject
	private idHasher: IdHasher;

	public async mapDynamicValuesRequest(
		persistValues: PersistDynamicValueContract[],
		serviceId: number,
	): Promise<MapRequestOptionalResult> {
		const user = await this.userContext.getCurrentUser();
		const dynamicValuesLookup = groupByKeyLastValue(persistValues, (e) => this.idHasher.decode(e.fieldIdSigned));

		const fieldDefinitions = await this.dynamicFieldsService.getServiceFields(serviceId);
		const validations: BusinessValidation[] = [];
		const dynamicValuesJson = [];
		for (const field of fieldDefinitions) {
			const fieldValue = dynamicValuesLookup.get(field.id);

			const visitor = new DynamicValueRequestVisitor(!user.isAdmin());
			visitor.mapFieldValueToJson(field, fieldValue);
			if (visitor.hasValidations) {
				validations.push(...visitor.validations);
			} else if (visitor.hasValueJson) {
				dynamicValuesJson.push(visitor.valueJson);
			}
		}

		if (validations.length > 0) {
			return { errorResult: validations } as ErrorResult<BusinessValidation[]>;
		}

		return { result: dynamicValuesJson } as OkResult<DynamicValueJsonModel[]>;
	}

	public mapDynamicValuesModel(dynamicValues: DynamicValueJsonModel[]): DynamicValueContract[] {
		return dynamicValues?.map((obj) => this.mapDynamicValueModel(obj));
	}

	private mapTypeToApiContract(type: DynamicValueType): DynamicValueTypeContract {
		const result = DynamicValuesMapper.DynamicValueTypeMapping[type];
		if (!result) {
			throw new Error(`DynamicValueType not found in DynamicValuesMapper: ${type}`);
		}
		return result;
	}

	public mapDynamicValueModel(value: DynamicValueJsonModel): DynamicValueContract {
		const contract = new DynamicValueContract();
		contract.fieldIdSigned = this.idHasher.encode(value.fieldId);
		contract.fieldName = value.fieldName;
		contract.type = this.mapTypeToApiContract(value.type);

		contract.singleSelectionKey = value.SingleSelectionKey;
		contract.singleSelectionValue = value.SingleSelectionValue;
		contract.textValue = value.textValue;

		return contract;
	}

	public getValueAsString(value: DynamicValueJsonModel): string {
		switch (value.type) {
		case DynamicValueType.SingleSelection:
			return value.SingleSelectionValue;
		case DynamicValueType.Text:
			return value.textValue;
		default:
			throw new Error(`DynamicValuesMapper.getValueAsString() not implemented for type: ${value.type}`);
		}
	}
}
