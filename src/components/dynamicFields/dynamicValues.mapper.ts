import { BusinessValidation } from '../../models';
import { Inject, InRequestScope } from 'typescript-ioc';
import { IdHasher } from '../../infrastructure/idHasher';
import {
	DynamicValueTypeContract,
	PersistDynamicValueContract,
	DynamicValueContract,
} from './dynamicValues.apicontract';
import { DynamicValueJsonModel, DynamicValueType } from '../../models/entities/jsonModels';
import { groupByKeyLastValue } from '../../tools/collections';
import { ErrorResult, OkResult, OptionalResult } from '../../errors';
import { DynamicValueRequestVisitor } from './dynamicValues.validation';
import { ContainerContext } from '../../infrastructure/containerContext';
import { UserContext } from '../../infrastructure/auth/userContext';
import { MyInfoDynamicField } from '../../models/entities/dynamicField';
import { DynamicFieldsService } from './dynamicFields.service';
import { MyInfoMetadataFactory } from '../myInfo/myInfoMetadata';
import { MyInfoResponseMapper } from '../myInfo/myInfoResponseMapper';

export type MapRequestOptionalResult = OptionalResult<DynamicValueJsonModel[], BusinessValidation[]>;

@InRequestScope
export class DynamicValuesRequestMapper {
	@Inject
	private containerContext: ContainerContext;
	@Inject
	private dynamicFieldsService: DynamicFieldsService;
	@Inject
	private idHasher: IdHasher;
	@Inject
	private userContext: UserContext;
	@Inject
	private myInfoMetadataFactory: MyInfoMetadataFactory;
	@Inject
	private myInfoResponseMapper: MyInfoResponseMapper;

	public async mapDynamicValues(
		persistValues: PersistDynamicValueContract[],
		existingValues: DynamicValueJsonModel[],
		serviceId: number,
	): Promise<MapRequestOptionalResult> {
		const requestValuesLookup = groupByKeyLastValue(persistValues, (e) => this.idHasher.decode(e.fieldIdSigned));
		const existingValuesLookup = groupByKeyLastValue(existingValues, (e) => e.fieldId);
		const dynamicFields = await this.dynamicFieldsService.getServiceFields(serviceId);

		const validations: BusinessValidation[] = [];
		const dynamicValuesJson = [];
		for (const field of dynamicFields) {
			const fieldRequestValue = requestValuesLookup.get(field.id);
			const visitor = this.containerContext.resolve(DynamicValueRequestVisitor);
			await visitor.mapFieldValueToJson({
				field,
				fieldValue: fieldRequestValue,
				existingValue: existingValuesLookup.get(field.id),
			});
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

	public async updateMyInfoDynamicFromUser(
		existingValues: DynamicValueJsonModel[],
		serviceId: number,
	): Promise<DynamicValueJsonModel[]> {
		const currentUser = await this.userContext.getCurrentUser();
		if (!currentUser || !currentUser.isSingPass()) {
			return existingValues;
		}

		const existingValuesLookup = groupByKeyLastValue(existingValues || [], (r) => r.fieldId);
		const fieldDefinitions = await this.dynamicFieldsService.getServiceFields(serviceId);
		const result: DynamicValueJsonModel[] = [];

		for (const field of fieldDefinitions) {
			const existingValue = existingValuesLookup.get(field.id);
			if (field instanceof MyInfoDynamicField) {
				if (this.myInfoMetadataFactory.isCitizenReadonly(field)) {
					const originalValue = await this.myInfoResponseMapper.mapOriginalValue(field);
					if (originalValue) {
						result.push(originalValue);
					}
					continue;
				}
			}

			if (existingValue) {
				result.push(existingValue);
			}
		}

		return result;
	}
}

@InRequestScope
export class DynamicValuesMapper {
	static readonly DynamicValueTypeMapping: Readonly<{ [key: string]: DynamicValueTypeContract }> = Object.freeze({
		[DynamicValueType.SingleSelection]: DynamicValueTypeContract.SingleSelection,
		[DynamicValueType.Text]: DynamicValueTypeContract.Text,
		[DynamicValueType.DateOnly]: DynamicValueTypeContract.DateOnly,
	});

	@Inject
	private idHasher: IdHasher;

	@Inject
	private myInfoResponseMapper: MyInfoResponseMapper;

	public mapDynamicValuesModel(dynamicValues: DynamicValueJsonModel[]): DynamicValueContract[] | undefined {
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
		contract.myInfoFieldType = value.myInfoFieldType;
		contract.dateOnlyValue = value.dateOnlyValue;
		contract.isReadonly = this.myInfoResponseMapper.isOriginReadonly(value.origin) ? true : undefined;

		return contract;
	}

	public getValueAsString(value: DynamicValueJsonModel): string {
		switch (value.type) {
			case DynamicValueType.SingleSelection:
				return value.SingleSelectionValue;
			case DynamicValueType.Text:
				return value.textValue;
			case DynamicValueType.DateOnly:
				return value.dateOnlyValue;
			default:
				throw new Error(`DynamicValuesMapper.getValueAsString() not implemented for type: ${value.type}`);
		}
	}
}
