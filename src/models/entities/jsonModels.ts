import { MyInfoFieldType } from './myInfoFieldType';
import { DynamicValueType } from '../dynamicValueType';
export { DynamicValueType } from '../dynamicValueType';

export enum InformationOriginType {
	BookingSG = 'bookingsg',
	MyInfo = 'myinfo',
}

export type DynamicValueOrigin = {
	originType: InformationOriginType;
	myInfoOrigin?: MyInfoOrigin;
};

export type MyInfoOrigin = {
	source?: string;
	classification?: string;
	lastupdated?: string;
};

/** Be aware of existing DB data when changing this model */
export type DynamicValueJsonModel = {
	fieldId: number;
	fieldName: string;
	myInfoFieldType?: MyInfoFieldType;
	type: DynamicValueType;
	SingleSelectionKey?: number | string;
	SingleSelectionValue?: string;
	multiSelection?: MultiSelectionJsonModel[];
	textValue?: string;
	dateOnlyValue?: string;
	origin?: DynamicValueOrigin;
};

export type MultiSelectionJsonModel = {
	key: number | string;
	value: string;
};
