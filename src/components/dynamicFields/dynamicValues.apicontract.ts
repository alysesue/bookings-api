// Classes that represent the content (value) of a dynamic field
import { MyInfoFieldType } from '../../models/entities/myInfoFieldType';

export enum DynamicValueTypeContract {
	SingleSelection = 'SingleSelection',
	Text = 'Text',
	DateOnly = 'DateOnly',
}

export class PersistDynamicValueContract {
	public fieldIdSigned: string;
	public type: DynamicValueTypeContract;
	public singleSelectionKey?: number | string;
	public textValue?: string;
	/**
	 * Date only value in the format YYYY-mm-dd
	 */
	public dateOnlyValue?: string;
}

export class DynamicValueContract {
	public fieldIdSigned: string;
	public myInfoFieldType?: MyInfoFieldType;
	public fieldName: string;
	public type: DynamicValueTypeContract;
	public singleSelectionKey?: number | string;
	public singleSelectionValue?: string;
	public textValue?: string;
	public dateOnlyValue?: string;
	/**
	 * Whether this value should not change. E.g. Verified MyInfo values.
	 */
	public isReadonly?: boolean;
}
