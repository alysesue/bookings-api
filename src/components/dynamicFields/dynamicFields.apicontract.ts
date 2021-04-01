export enum DynamicFieldType {
	SelectList = 'SelectList',
}

export class DynamicFieldModel {
	public idSigned: string;
	public name: string;
	public type: DynamicFieldType;
	public SelectList: SelectListModel;
}

// Classes that represent the metadata (definition) of a dynamic field

export class SelectListModel {
	public options: SelectListOptionModel[];
}

export class SelectListOptionModel {
	public key: number;
	public value: string;
}
