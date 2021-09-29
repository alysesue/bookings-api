import { DynamicField } from '../../../models/entities';
import { MyInfoMetadataFactory } from '../myInfoMetadata';

export class MyInfoMetadataFactoryMock implements Partial<MyInfoMetadataFactory> {
	public static isCitizenReadonly = jest.fn<boolean, any>();
	public static getFieldMetadata = jest.fn<DynamicField, any>();

	public isCitizenReadonly(...params): boolean {
		return MyInfoMetadataFactoryMock.isCitizenReadonly(...params);
	}

	public getFieldMetadata(...params): DynamicField {
		return MyInfoMetadataFactoryMock.getFieldMetadata(...params);
	}
}
