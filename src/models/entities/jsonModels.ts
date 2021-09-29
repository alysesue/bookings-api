import { MyInfoFieldType } from './myInfoFieldType';

export enum DynamicValueType {
	SingleSelection = 'SingleSelection',
	Text = 'Text',
	DateOnly = 'DateOnly',
}

export enum InformationOriginType {
	BookingSG = 'bookingsg',
	MyInfo = 'myinfo',
}

export type MyInfoOrigin = {
	source?: string;
	classification?: string;
	lastupdated?: string;
};

export type DynamicValueJsonModel = {
	fieldId: number;
	fieldName: string;
	myInfoFieldType?: MyInfoFieldType;
	type: DynamicValueType;
	SingleSelectionKey?: number | string;
	SingleSelectionValue?: string;
	textValue?: string;
	dateOnlyValue?: string;
	origin?: {
		originType: InformationOriginType;
		myInfoOrigin?: MyInfoOrigin;
	};
};
