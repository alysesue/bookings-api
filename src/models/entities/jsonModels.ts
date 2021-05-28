export enum DynamicValueType {
	SingleSelection = 'SingleSelection',
	Text = 'Text',
}

export type DynamicValueJsonModel = {
	fieldId: number;
	fieldName: string;
	type: DynamicValueType;
	SingleSelectionKey?: number;
	SingleSelectionValue?: string;
	textValue?: string;
};
