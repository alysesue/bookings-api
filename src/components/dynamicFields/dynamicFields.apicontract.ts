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

// Classes that represent the metadata (definition) of a dynamic field

export class SelectListModel {
	public options: SelectListOptionModel[];
}

export class SelectListOptionModel {
	public key: number;
	public value: string;
}

export class TextFieldModel {
	/**
	 * @isInt
	 */
	public charLimit: number;
}
