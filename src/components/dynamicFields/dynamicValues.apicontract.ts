// Classes that represent the content (value) of a dynamic field
import { DynamicValueType } from '../../models/enums';
// DynamicValueType -> DynamicValueTypeContract - This is for code backward compatibility
export { DynamicValueType as DynamicValueTypeContract } from '../../models/enums';
import { MyInfoFieldType } from '../../models/entities/myInfoFieldType';

export class PersistDynamicValueContract {
	public fieldIdSigned: string;
	public type: DynamicValueType;
	public singleSelectionKey?: number | string;
	public multiSelection?: DynamicOptionContract[];
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
	public type: DynamicValueType;
	public singleSelectionKey?: number | string;
	public singleSelectionValue?: string;
	public multiSelection?: DynamicOptionContract[];
	public textValue?: string;
	public dateOnlyValue?: string;
	/**
	 * Whether this value should not change. E.g. Verified MyInfo values.
	 */
	public isReadonly?: boolean;
}

export class DynamicOptionContract {
	/**
	 * The key for this selection option (required)
	 */
	public key: number | string;

	/**
	 * The value for this selection option. Only used for responses.
	 * The value is not relevant for requests and will be ignored.
	 */
	public value?: string;
}
