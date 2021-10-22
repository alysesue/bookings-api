import {
	DateOnlyDynamicField,
	DynamicField,
	MyInfoDynamicField,
	SelectListDynamicField,
	TextDynamicField,
} from '../../../models';
import { Container } from 'typescript-ioc';
import { MyInfoFieldType } from '../../../models/entities/myInfoFieldType';
import { MyInfoMetadataFactory } from '../myInfoMetadata';

describe('MyInfo Metadata', () => {
	const expectedMetadataType: { [key: string]: typeof DynamicField } = {
		[MyInfoFieldType.dob]: DateOnlyDynamicField,
		[MyInfoFieldType.nationality]: SelectListDynamicField,
		[MyInfoFieldType.regadd_postal]: TextDynamicField,
		[MyInfoFieldType.residentialstatus]: SelectListDynamicField,
		[MyInfoFieldType.sex]: SelectListDynamicField,
	};

	it('should get metata for all myinfo types', () => {
		const factory = Container.get(MyInfoMetadataFactory);

		const enumValues = Object.values(MyInfoFieldType);
		for (const myInfoFieldType of enumValues) {
			const sampleMyInfo = MyInfoDynamicField.create(1, 'Label', myInfoFieldType);
			sampleMyInfo.id = 2;
			sampleMyInfo.isMandatory = false;
			const metadata = factory.getFieldMetadata(sampleMyInfo);

			const expectedType = expectedMetadataType[myInfoFieldType];

			expect(metadata instanceof expectedType).toBe(true);
			expect(metadata.id).toEqual(2);
			expect(metadata.name).toEqual('Label');
			expect(metadata.isMandatory).toEqual(false);
			expect(metadata.serviceId).toEqual(sampleMyInfo.serviceId);
		}
	});
});
