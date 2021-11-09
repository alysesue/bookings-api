import { DateOnlyDynamicField, MyInfoDynamicField } from '../../models/entities/dynamicField';
import { DynamicField, SelectListDynamicField, DynamicKeyValueOption, TextDynamicField } from '../../models';
import { MyInfoFieldType } from '../../models/entities/myInfoFieldType';
import { InRequestScope } from 'typescript-ioc';
import { nationalityCodes } from './data/nationalityCodes';

@InRequestScope
export class MyInfoMetadataFactory {
	public isCitizenReadonly(_myInfoField: MyInfoDynamicField): boolean {
		// All extra fields are readonly atm, Mobile numner and email are not considered dynamic fields (unless this changes later)
		return true;
	}

	public getFieldMetadata(myInfoField: MyInfoDynamicField): DynamicField {
		let metadata: DynamicField;
		switch (myInfoField.myInfoFieldType) {
			case MyInfoFieldType.regadd_postal:
				metadata = this.postalField();
				break;
			case MyInfoFieldType.residentialstatus:
				metadata = this.residentialStatus();
				break;
			case MyInfoFieldType.sex:
				metadata = this.sex();
				break;
			case MyInfoFieldType.nationality:
				metadata = this.nationality();
				break;
			case MyInfoFieldType.dob:
				metadata = this.dob();
				break;
			default:
				throw new Error(`MyInfoMetadataFactory not implemented for value: ${myInfoField.myInfoFieldType}`);
		}

		metadata.id = myInfoField.id;
		metadata.name = myInfoField.name;
		metadata.isMandatory = myInfoField.isMandatory;
		metadata.serviceId = myInfoField.serviceId;

		return metadata;
	}

	private postalField(): DynamicField {
		const field = new TextDynamicField();
		field.charLimit = 6;

		return field;
	}

	private residentialStatus(): DynamicField {
		const field = new SelectListDynamicField();
		field.options = [
			{ key: 'A', value: 'Alien' } as DynamicKeyValueOption,
			{ key: 'C', value: 'Citizen' } as DynamicKeyValueOption,
			{ key: 'P', value: 'PR' } as DynamicKeyValueOption,
			{ key: 'U', value: 'Unknown' } as DynamicKeyValueOption,
			{ key: 'N', value: 'Not applicable' } as DynamicKeyValueOption,
		];

		return field;
	}

	private sex(): DynamicField {
		const field = new SelectListDynamicField();
		field.options = [
			{ key: 'F', value: 'Female' } as DynamicKeyValueOption,
			{ key: 'M', value: 'Male' } as DynamicKeyValueOption,
			{ key: 'U', value: 'Unknown' } as DynamicKeyValueOption,
		];

		return field;
	}

	private nationality(): DynamicField {
		const field = new SelectListDynamicField();
		field.options = nationalityCodes
			.getValue()
			.map((e) => ({ key: e.CODE, value: e.DESCRIPTION } as DynamicKeyValueOption));

		return field;
	}

	private dob(): DynamicField {
		return new DateOnlyDynamicField();
	}
}
