import { BusinessValidation, BusinessValidationTemplate, DynamicField, SelectListDynamicField } from '../../models';

import { IDynamicFieldVisitor, TextDynamicField } from '../../models/entities/dynamicField';
import { DynamicValueTypeContract, PersistDynamicValueContract } from './dynamicValues.apicontract';
import { DynamicValueJsonModel, DynamicValueType } from '../../models/entities/jsonModels';
import { ErrorsRef } from '../../errors/errors.ref';

export class DynamicValueRequestVisitor implements IDynamicFieldVisitor {
	private _fieldValue: PersistDynamicValueContract;
	private _valueJson: Partial<DynamicValueJsonModel>;
	private _businessValidations: BusinessValidation[];

	constructor() {
		this._valueJson = undefined;
		this._businessValidations = [];
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
			this.checkMandatoryField(_selectListField);
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
		this.addValidation(DynamicValueBusinessValidations.FieldValueIsRequired.create(field));

		this._valueJson = undefined;
		return;
	}

	private checkMandatoryField(field: DynamicField): boolean {
		if (field.isMandatory) {
			this.markFieldNotProvided(field);
		}

		return field.isMandatory;
	}

	visitTextField(_textField: TextDynamicField) {
		if (this._fieldValue.type !== DynamicValueTypeContract.Text) {
			this.addValidation(DynamicValueBusinessValidations.IncorrectFieldValueType.create(_textField));
			return;
		}
		this._fieldValue.textValue = this._fieldValue.textValue?.trim();

		if (!this._fieldValue.textValue) {
			this.checkMandatoryField(_textField);
			return;
		}

		if (this._fieldValue.textValue.length > _textField.charLimit) {
			this.addValidation(DynamicValueBusinessValidations.TextFieldLimit.create(_textField));
			return;
		}

		this._valueJson = { ...this._valueJson, type: DynamicValueType.Text, textValue: this._fieldValue.textValue };
	}

	public mapFieldValueToJson(field: DynamicField, fieldValue: PersistDynamicValueContract): void {
		// Skip checks if no value input and mark error if only it is a mandatory field
		if (!fieldValue) {
			this.checkMandatoryField(field);
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
	public static errors = ErrorsRef().dynamicValue;

	public static readonly IncorrectFieldValueType = new BusinessValidationTemplate<{ name: string }>(
		DynamicValueBusinessValidations.errors.IncorrectFieldValueType,
	);

	public static readonly FieldValueIsRequired = new BusinessValidationTemplate<{ name: string }>(
		DynamicValueBusinessValidations.errors.FieldValueIsRequired,
	);

	public static readonly TextFieldLimit = new BusinessValidationTemplate<{ name: string; charLimit: number }>(
		DynamicValueBusinessValidations.errors.TextFieldLimit,
	);
}
