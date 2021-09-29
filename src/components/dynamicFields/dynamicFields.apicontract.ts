import { MyInfoFieldType } from '../../models/entities/myInfoFieldType';

export enum DynamicFieldType {
	SelectList = 'SelectList',
	TextField = 'TextField',
	DateOnlyField = 'DateOnlyField',
}

export class DynamicFieldModel {
	public idSigned: string;
	public name: string;
	public myInfoFieldType?: MyInfoFieldType;
	public type: DynamicFieldType;
	public selectList?: SelectListModel;
	public textField?: TextFieldModel;
	public isMandatory: boolean;
	public isCitizenReadonly?: boolean;
}

export class PersistDynamicFieldModelBase {
	/**
	 * @ignore
	 */
	public idSigned?: string;
	public name?: string;
	public type?: DynamicFieldType;
	public myInfoFieldType?: MyInfoFieldType;
	public selectList?: SelectListModel;
	public textField?: TextFieldModel;
	/**
	 * default is false
	 */
	public isMandatory?: boolean;
}

export class PersistDynamicFieldModelV1 extends PersistDynamicFieldModelBase {
	/**
	 * @ignore
	 */
	public serviceId?: number;
}

export class PersistDynamicFieldModelV2 extends PersistDynamicFieldModelBase {
	/**
	 * @ignore
	 */
	public serviceId?: string;
}

// Classes that represent the metadata (definition) of a dynamic field

export class SelectListModel {
	public options: SelectListOptionModel[];
}

export class SelectListOptionModel {
	/**
	 * @isInt
	 * @minimum 1
	 */
	public key: number | string;
	public value: string;

	public static create(key: number | string, value: string) {
		const option = new SelectListOptionModel();
		option.key = key;
		option.value = value;
		return option;
	}
}

export class TextFieldModel {
	/**
	 * @isInt
	 */
	public charLimit: number;
}
