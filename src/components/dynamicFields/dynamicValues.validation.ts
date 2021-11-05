import { BusinessValidation, BusinessValidationTemplate, DynamicField, SelectListDynamicField } from '../../models';

import {
	DateOnlyDynamicField,
	IDynamicFieldVisitorAsync,
	MyInfoDynamicField,
	TextDynamicField,
} from '../../models/entities/dynamicField';
import { DynamicValueTypeContract, PersistDynamicValueContract } from './dynamicValues.apicontract';
import { DynamicValueJsonModel, DynamicValueType, InformationOriginType } from '../../models/entities/jsonModels';
import { ErrorsRef } from '../../errors/errors.ref';
import { MyInfoMetadataFactory } from '../myInfo/myInfoMetadata';
import { cloneDeep } from 'lodash';
import { Inject, Scope, Scoped } from 'typescript-ioc';
import { ContainerContext } from '../../infrastructure/containerContext';
import { UserContext } from '../../infrastructure/auth/userContext';
import { MyInfoResponseMapper } from '../myInfo/myInfoResponseMapper';
import { tryParseDateOnly } from '../../tools/date';

type ValidationState = {
	_fieldValue?: PersistDynamicValueContract;
	_valueJson?: Partial<DynamicValueJsonModel>;
	_existingValue?: DynamicValueJsonModel;
	_businessValidations: BusinessValidation[];
};

@Scoped(Scope.Local)
export class DynamicValueRequestVisitor implements IDynamicFieldVisitorAsync {
	@Inject
	private containerContext: ContainerContext;
	@Inject
	private myInfoMetadata: MyInfoMetadataFactory;
	@Inject
	private myInfoResponseMapper: MyInfoResponseMapper;
	@Inject
	private userContext: UserContext;

	private _validationState: ValidationState;

	constructor() {
		this._validationState = {
			_fieldValue: undefined,
			_valueJson: undefined,
			_businessValidations: [],
		};
	}

	private addValidation(validation: BusinessValidation) {
		this._validationState._businessValidations.push(validation);
	}

	async visitSelectList(_selectListField: SelectListDynamicField): Promise<void> {
		// valid field value type for this field
		if (this._validationState._fieldValue.type !== DynamicValueTypeContract.SingleSelection) {
			this.addValidation(DynamicValueBusinessValidations.IncorrectFieldValueType.create(_selectListField));
			return;
		}

		const selectedOption = _selectListField.options.find(
			(o) => o.key === this._validationState._fieldValue.singleSelectionKey,
		);
		if (!selectedOption) {
			this.checkMandatoryField(_selectListField);
			return;
		}

		this._validationState._valueJson = {
			...this._validationState._valueJson,
			type: DynamicValueType.SingleSelection,
			SingleSelectionKey: selectedOption?.key,
			SingleSelectionValue: selectedOption?.value,
		};
	}

	private markFieldNotProvided(field: DynamicField): void {
		this.addValidation(DynamicValueBusinessValidations.FieldValueIsRequired.create(field));

		this._validationState._valueJson = undefined;
	}

	private checkMandatoryField(field: DynamicField): void {
		if (field.isMandatory) {
			this.markFieldNotProvided(field);
		}
	}

	async visitTextField(_textField: TextDynamicField): Promise<void> {
		if (this._validationState._fieldValue.type !== DynamicValueTypeContract.Text) {
			this.addValidation(DynamicValueBusinessValidations.IncorrectFieldValueType.create(_textField));
			return;
		}
		this._validationState._fieldValue.textValue = this._validationState._fieldValue.textValue?.trim();

		if (!this._validationState._fieldValue.textValue) {
			this.checkMandatoryField(_textField);
			return;
		}

		if (this._validationState._fieldValue.textValue.length > _textField.charLimit) {
			this.addValidation(DynamicValueBusinessValidations.TextFieldLimit.create(_textField));
			return;
		}

		this._validationState._valueJson = {
			...this._validationState._valueJson,
			type: DynamicValueType.Text,
			textValue: this._validationState._fieldValue.textValue,
		};
	}

	async visitDateOnlyField(_dateOnlyField: DateOnlyDynamicField): Promise<void> {
		if (this._validationState._fieldValue.type !== DynamicValueTypeContract.DateOnly) {
			this.addValidation(DynamicValueBusinessValidations.IncorrectFieldValueType.create(_dateOnlyField));
			return;
		}

		const dateOnlyValue = this._validationState._fieldValue.dateOnlyValue?.trim();
		if (!dateOnlyValue) {
			this.checkMandatoryField(_dateOnlyField);
			return;
		}

		const result = tryParseDateOnly(dateOnlyValue);
		if (result.isValid) {
			this._validationState._valueJson = {
				...this._validationState._valueJson,
				type: DynamicValueType.DateOnly,
				dateOnlyValue: result.parsed,
			};
		} else {
			this.addValidation(DynamicValueBusinessValidations.DateOnlyInvalid.create(_dateOnlyField));
		}
	}

	async visitMyInfo(_myInfoDynamicField: MyInfoDynamicField): Promise<void> {
		const currentUser = await this.userContext.getCurrentUser();
		if (!currentUser) return;

		const isCitizenReadonly = this.myInfoMetadata.isCitizenReadonly(_myInfoDynamicField);
		const { _fieldValue, _existingValue } = this._validationState;
		const isExistingValueReadOnly = _existingValue
			? this.myInfoResponseMapper.isOriginReadonly(_existingValue.origin)
			: false;
		let result: ValidationState = cloneDeep(this._validationState);

		result._valueJson = _existingValue;

		if (isCitizenReadonly && currentUser.isSingPass()) {
			result._valueJson = await this.myInfoResponseMapper.mapOriginalValue(_myInfoDynamicField);
		} else if (!isExistingValueReadOnly) {
			if (_fieldValue) {
				const metadata = this.myInfoMetadata.getFieldMetadata(_myInfoDynamicField);
				const metadataVisitor = this.containerContext.resolve(DynamicValueRequestVisitor);
				await metadataVisitor.mapFieldValueToJson({
					field: metadata,
					fieldValue: _fieldValue,
					existingValue: _existingValue,
				});

				result = cloneDeep(metadataVisitor._validationState);
				result._valueJson.myInfoFieldType = _myInfoDynamicField.myInfoFieldType;
			} else {
				result._valueJson = undefined;
			}
		}

		this._validationState = result;
	}

	public async mapFieldValueToJson({
		field,
		fieldValue,
		existingValue,
	}: {
		field: DynamicField;
		fieldValue: PersistDynamicValueContract | undefined;
		existingValue?: DynamicValueJsonModel;
	}): Promise<void> {
		// Skip checks if no value input and mark error if only it is a mandatory field
		if (!fieldValue && !(field instanceof MyInfoDynamicField)) {
			this.checkMandatoryField(field);
			return;
		}

		this._validationState._fieldValue = fieldValue;
		this._validationState._existingValue = existingValue;
		this._validationState._valueJson = {
			fieldId: field.id,
			fieldName: field.name,
			origin: {
				originType: InformationOriginType.BookingSG, // default value
			},
		};

		await field.acceptVisitorAsync(this);
	}

	public get hasValueJson(): boolean {
		return !this.hasValidations && !!this._validationState._valueJson;
	}

	public get valueJson(): DynamicValueJsonModel | undefined {
		if (!this.hasValueJson) {
			return undefined;
		}

		return this._validationState._valueJson as DynamicValueJsonModel;
	}

	public get hasValidations(): boolean {
		return this._validationState._businessValidations.length > 0;
	}

	public get validations(): BusinessValidation[] {
		return this._validationState._businessValidations;
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

	public static readonly DateOnlyInvalid = new BusinessValidationTemplate<{ name: string }>(
		DynamicValueBusinessValidations.errors.DateOnlyInvalid,
	);
}
