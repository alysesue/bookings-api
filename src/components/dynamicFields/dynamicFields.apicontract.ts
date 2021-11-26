import { MyInfoFieldType } from '../../models/entities/myInfoFieldType';

export enum DynamicFieldType {
	SelectList = 'SelectList',
	RadioList = 'RadioList',
	CheckboxList = 'CheckboxList',
	TextField = 'TextField',
	TextAreaField = 'TextAreaField',
	DateOnlyField = 'DateOnlyField',
}

export class DynamicFieldModel {
	public idSigned: string;
	public name: string;
	public myInfoFieldType?: MyInfoFieldType;
	public type: DynamicFieldType;
	public selectList?: FieldWithOptionsModel;
	public radioList?: FieldWithOptionsModel;
	public checkboxList?: FieldWithOptionsModel;
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
	public selectList?: FieldWithOptionsModel;
	public radioList?: FieldWithOptionsModel;
	public checkboxList?: FieldWithOptionsModel;
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

export class FieldWithOptionsModel {
	public options: DynamicOptionModel[];
}

export class DynamicOptionModel {
	/**
	 * @isInt
	 * @minimum 1
	 */
	public key: number | string;
	public value: string;

	protected static createOption<T extends DynamicOptionModel>(
		constructor: new () => T,
		key: number | string,
		value: string,
	): T {
		const option = new constructor();
		option.key = key;
		option.value = value;
		return option;
	}

	public static create(key: number | string, value: string): DynamicOptionModel {
		return DynamicOptionModel.createOption(DynamicOptionModel, key, value);
	}
}

export class TextFieldModel {
	/**
	 * @isInt
	 */
	public charLimit: number;
}
