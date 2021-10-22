import { DynamicValueJsonModel } from '../../../models/entities/jsonModels';
import { DynamicValueContract, DynamicValueTypeContract } from '../dynamicValues.apicontract';
import { DynamicValuesMapper, DynamicValuesRequestMapper, MapRequestOptionalResult } from '../dynamicValues.mapper';

export class DynamicValuesMapperMock implements Partial<DynamicValuesMapper> {
	public static getValueAsString = jest.fn<string, any>();
	public static mapDynamicValuesModel = jest.fn<DynamicValueContract[], any>();
	public static mapTypeToApiContract = jest.fn<DynamicValueTypeContract, any>();
	public static mapDynamicValueModel = jest.fn<DynamicValueContract, any>();

	public getValueAsString(...params): string {
		return DynamicValuesMapperMock.getValueAsString(...params);
	}

	public mapDynamicValuesModel(...params): DynamicValueContract[] {
		return DynamicValuesMapperMock.mapDynamicValuesModel(...params);
	}

	public mapTypeToApiContract(...params): DynamicValueTypeContract {
		return DynamicValuesMapperMock.mapTypeToApiContract(...params);
	}

	public mapDynamicValueModel(...params): DynamicValueContract {
		return DynamicValuesMapperMock.mapDynamicValueModel(...params);
	}
}
export class DynamicValuesRequestMapperMock implements Partial<DynamicValuesRequestMapper> {
	public static mapDynamicValues = jest.fn<Promise<MapRequestOptionalResult>, any>();
	public static updateMyInfoDynamicFromUser = jest.fn<
		Promise<DynamicValueJsonModel[]>,
		[DynamicValueJsonModel[], number]
	>();

	public async mapDynamicValues(...params): Promise<MapRequestOptionalResult> {
		return await DynamicValuesRequestMapperMock.mapDynamicValues(...params);
	}
	public async updateMyInfoDynamicFromUser(
		dynamicValues: DynamicValueJsonModel[],
		serviceId: number,
	): Promise<DynamicValueJsonModel[]> {
		return await DynamicValuesRequestMapperMock.updateMyInfoDynamicFromUser(dynamicValues, serviceId);
	}
}
