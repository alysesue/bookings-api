export enum DynamicFieldType {
	SelectList = 'SelectList',
	TextField = 'TextField',
}

export class DynamicFieldModel {
	public idSigned: string;
	public name: string;
	public type: DynamicFieldType;
	public selectList?: SelectListModel;
	public textField?: TextFieldModel;
	public isMandatory: boolean;
}

export class PersistDynamicFieldModelBase {
	/**
	 * @ignore
	 */
	public idSigned?: string;
	public name: string;
	public type: DynamicFieldType;
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
	 */
	public key: number;
	public value: string;
}

export class TextFieldModel {
	/**
	 * @isInt
	 */
	public charLimit: number;
}
