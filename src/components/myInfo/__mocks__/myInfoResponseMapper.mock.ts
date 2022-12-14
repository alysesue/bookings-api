import { DynamicValueJsonModel } from '../../../models/entities/jsonModels';
import { MyInfoResponseMapper } from '../myInfoResponseMapper';

export class MyInfoResponseMapperMock implements Partial<MyInfoResponseMapper> {
	public static mapOriginalValue = jest.fn<Promise<DynamicValueJsonModel | undefined>, any>();
	public static isOriginReadonly = jest.fn<boolean, any>();

	public async mapOriginalValue(...params): Promise<DynamicValueJsonModel | undefined> {
		return await MyInfoResponseMapperMock.mapOriginalValue(...params);
	}
	public isOriginReadonly(...params): boolean {
		return MyInfoResponseMapperMock.isOriginReadonly(...params);
	}
}
