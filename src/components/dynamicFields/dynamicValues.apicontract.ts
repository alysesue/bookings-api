// Classes that represent the content (value) of a dynamic field

export enum DynamicValueTypeContract {
	SingleSelection = 'SingleSelection',
}

export class PersistDynamicValueContract {
	public fieldIdSigned: string;
	public type: DynamicValueTypeContract;
	public SingleSelectionKey?: number;
}

export class DynamicValueContract {
	public fieldIdSigned: string;
	public fieldName: string;
	public type: DynamicValueTypeContract;
	public SingleSelectionKey?: number;
	public SingleSelectionValue?: string;
}
