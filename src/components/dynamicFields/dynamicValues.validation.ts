import { BusinessValidation, BusinessValidationTemplate, DynamicField, SelectListDynamicField } from '../../models';

import { IDynamicFieldVisitor, TextDynamicField } from '../../models/entities/dynamicField';
import { DynamicValueTypeContract, PersistDynamicValueContract } from './dynamicValues.apicontract';
import { DynamicValueJsonModel, DynamicValueType } from '../../models/entities/booking';

export class DynamicValueRequestVisitor implements IDynamicFieldVisitor {
	private _fieldValue: PersistDynamicValueContract;
	private _valueJson: Partial<DynamicValueJsonModel>;
	private _businessValidations: BusinessValidation[];
	private _validateRequiredFields: boolean;

	constructor(validateRequiredFields: boolean) {
		this._valueJson = undefined;
		this._businessValidations = [];
		this._validateRequiredFields = validateRequiredFields;
	}

	private addValidation(validation: BusinessValidation) {
		this._businessValidations.push(validation);
	}

	visitSelectList(_selectListField: SelectListDynamicField) {
		// valid field value type for this field
		if (this._fieldValue.type !== DynamicValueTypeContract.SingleSelection) {
			this.addValidation(DynamicValueBusinessValidations.IncorrectFieldValueType.create(_selectListField));
			return;
		}

		const selectedOption = _selectListField.options.find((o) => o.key === this._fieldValue.singleSelectionKey);
		if (!selectedOption) {
			this.markFieldNotProvided(_selectListField);
			return;
		}

		this._valueJson = {
			...this._valueJson,
			type: DynamicValueType.SingleSelection,
			SingleSelectionKey: selectedOption?.key,
			SingleSelectionValue: selectedOption?.value,
		};
	}

	private markFieldNotProvided(field: DynamicField) {
		// validation not allowed for admins (they can't input values), it might change in the future
		if (this._validateRequiredFields) {
			this.addValidation(DynamicValueBusinessValidations.FieldValueIsRequired.create(field));
		}

		this._valueJson = undefined;
		return;
	}

	visitTextField(_textField: TextDynamicField) {
		if (this._fieldValue.type !== DynamicValueTypeContract.Text) {
			this.addValidation(DynamicValueBusinessValidations.IncorrectFieldValueType.create(_textField));
			return;
		}
		this._fieldValue.textValue = this._fieldValue.textValue?.trim();

		if (!this._fieldValue.textValue) {
			this.markFieldNotProvided(_textField);
			return;
		}

		if (this._fieldValue.textValue.length > _textField.charLimit) {
			this.addValidation(DynamicValueBusinessValidations.TextFieldLimit.create(_textField));
			return;
		}

		this._valueJson = { ...this._valueJson, type: DynamicValueType.Text, textValue: this._fieldValue.textValue };
	}

	public mapFieldValueToJson(field: DynamicField, fieldValue: PersistDynamicValueContract): void {
		if (!fieldValue) {
			// All field values are required for now
			this.markFieldNotProvided(field);
			return;
		}

		this._fieldValue = fieldValue;
		this._valueJson = {
			fieldId: field.id,
			fieldName: field.name,
		};
		field.acceptVisitor(this);
	}

	public get hasValueJson(): boolean {
		return !this.hasValidations && !!this._valueJson;
	}

	public get valueJson(): DynamicValueJsonModel | undefined {
		if (!this.hasValueJson) {
			return undefined;
		}

		return this._valueJson as DynamicValueJsonModel;
	}

	public get hasValidations(): boolean {
		return this._businessValidations.length > 0;
	}

	public get validations(): BusinessValidation[] {
		return this._businessValidations;
	}
}

/**
 * Business validation range: 10201-10299
 */
class DynamicValueBusinessValidations {
	private constructor() {}

	public static readonly IncorrectFieldValueType = new BusinessValidationTemplate<{ name: string }>({
		code: '10201',
		templateMessage: ({ name }) => `Value type mismatch for ${name} field.`,
	});

	public static readonly FieldValueIsRequired = new BusinessValidationTemplate<{ name: string }>({
		code: '10202',
		templateMessage: ({ name }) => `${name} field is required.`,
	});

	public static readonly TextFieldLimit = new BusinessValidationTemplate<{ name: string; charLimit: number }>({
		code: '10250',
		templateMessage: ({ name, charLimit }) => `${name} word limit is ${charLimit} characters.`,
	});
}
