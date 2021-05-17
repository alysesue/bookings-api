// Classes that represent the content (value) of a dynamic field

export enum DynamicValueTypeContract {
	SingleSelection = 'SingleSelection',
	Text = 'Text',
}

export class PersistDynamicValueContract {
	public fieldIdSigned: string;
	public type: DynamicValueTypeContract;
	public singleSelectionKey?: number;
	public textValue?: string;
}

export class DynamicValueContract {
	public fieldIdSigned: string;
	public fieldName: string;
	public type: DynamicValueTypeContract;
	public singleSelectionKey?: number;
	public singleSelectionValue?: string;
	public textValue?: string;
}
