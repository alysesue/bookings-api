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
}

export class PersistDynamicFieldModel {
	/**
	 * @ignore
	 */
	public idSigned?: string;
	/**
	 * @ignore
	 */
	public serviceId?: number;
	public name: string;
	public type: DynamicFieldType;
	public selectList?: SelectListModel;
	public textField?: TextFieldModel;
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
