import { DynamicField, DynamicKeyValueOption, SelectListDynamicField } from '../../models';
import { Inject, InRequestScope, Scope, Scoped } from 'typescript-ioc';
import {
	DynamicFieldModel,
	DynamicFieldType,
	DynamicOptionModel,
	FieldWithOptionsModel,
	PersistDynamicFieldModelV1,
	TextFieldModel,
	TextFieldType,
} from './dynamicFields.apicontract';
import { IdHasher } from '../../infrastructure/idHasher';
import {
	CheckboxListDynamicField,
	DateOnlyDynamicField,
	DynamicFieldWithOptionsBase,
	IDynamicFieldVisitor,
	MyInfoDynamicField,
	RadioListDynamicField,
	TextDynamicField,
} from '../../models/entities/dynamicField';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { groupByKeyLastValue } from '../../tools/collections';
import { DEFAULT_MYINFO_NAMES, MyInfoFieldType } from '../../models/entities/myInfoFieldType';
import { MyInfoMetadataFactory } from '../myInfo/myInfoMetadata';
import { cloneDeep } from 'lodash';
import { ContainerContext } from '../../infrastructure/containerContext';
import { safeCast } from '../../tools/object';

@InRequestScope
export class DynamicFieldsMapper {
	@Inject
	private containerContext: ContainerContext;

	public mapDataModels(entries: DynamicField[]): DynamicFieldModel[] {
		return entries.map((e) => this.mapDataModel(e));
	}

	public mapDataModel(field: DynamicField): DynamicFieldModel {
		const visitor = this.containerContext.resolve(DynamicFieldMapperVisitor);
		return visitor.mapDataModel(field);
	}

	private checkExpectedEntityType(model: PersistDynamicFieldModelV1, entity: DynamicField): [boolean, DynamicField] {
		if (model.myInfoFieldType) {
			return entity instanceof MyInfoDynamicField ? [true, entity] : [false, entity];
		}

		switch (model.type) {
			case DynamicFieldType.SelectList:
				if (entity instanceof SelectListDynamicField) {
					return [true, entity];
				} else if (entity instanceof RadioListDynamicField) {
					// Expected type - SelectList, current type - RadioList, we can change it because they are both single selection.
					const selectList = SelectListDynamicField.create(entity);
					selectList.id = entity.id; // preserve id - so it's an UPDATE operation
					return [true, selectList];
				} else {
					return [false, entity];
				}
			case DynamicFieldType.RadioList:
				if (entity instanceof RadioListDynamicField) {
					return [true, entity];
				} else if (entity instanceof SelectListDynamicField) {
					// Expected type - RadioList, current type - SelectList, we can change it because they are both single selection.
					const radioList = RadioListDynamicField.create(entity);
					radioList.id = entity.id; // preserve id - so it's an UPDATE operation
					return [true, radioList];
				} else {
					return [false, entity];
				}
			case DynamicFieldType.CheckboxList:
				return entity instanceof CheckboxListDynamicField ? [true, entity] : [false, entity];
			case DynamicFieldType.TextField:
			case DynamicFieldType.TextAreaField:
				return entity instanceof TextDynamicField ? [true, entity] : [false, entity];
			case DynamicFieldType.DateOnlyField:
				return entity instanceof DateOnlyDynamicField ? [true, entity] : [false, entity];
			default:
				throw new Error(`DynamicFieldsMapper.checkExpectedEntityType not implemented for type: ${model.type}`);
		}
	}

	private validateDynamicOptions(optionsRequest: DynamicOptionModel[] | undefined): DynamicOptionModel[] {
		if (!optionsRequest?.length) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(
				`This field type must contain at least one option.`,
			);
		}

		if (optionsRequest.find((o: DynamicOptionModel) => o.key === 0)) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(
				`This field type must not contain option with key 0.`,
			);
		}

		// ensures key uniqueness
		const options = Array.from(groupByKeyLastValue(optionsRequest, (o) => o.key).values());
		return options;
	}

	private mapToFieldWithOptions<T extends DynamicFieldWithOptionsBase>(
		model: PersistDynamicFieldModelV1,
		options: DynamicOptionModel[] | undefined,
		entity: T | null,
		creator: (params: {
			serviceId: number;
			name: string;
			options: DynamicKeyValueOption[];
			isMandatory: boolean;
		}) => T,
	): T {
		const validatedOptions = this.validateDynamicOptions(options);

		if (entity) {
			entity.name = model.name;
			entity.options = validatedOptions;
			entity.isMandatory = model.isMandatory;
			return entity;
		}

		return creator({
			serviceId: model.serviceId,
			name: model.name,
			options: validatedOptions,
			isMandatory: model.isMandatory,
		});
	}

	private mapToSelectListField(
		model: PersistDynamicFieldModelV1,
		entity: SelectListDynamicField | null,
	): SelectListDynamicField {
		return this.mapToFieldWithOptions(model, model.selectList?.options, entity, SelectListDynamicField.create);
	}

	private mapToRadioListField(
		model: PersistDynamicFieldModelV1,
		entity: RadioListDynamicField | null,
	): RadioListDynamicField {
		return this.mapToFieldWithOptions(model, model.radioList?.options, entity, RadioListDynamicField.create);
	}

	private mapToCheckboxListField(
		model: PersistDynamicFieldModelV1,
		entity: CheckboxListDynamicField | null,
	): CheckboxListDynamicField {
		return this.mapToFieldWithOptions(model, model.checkboxList?.options, entity, CheckboxListDynamicField.create);
	}

	private mapToTextField(model: PersistDynamicFieldModelV1, entity: TextDynamicField | null): DynamicField {
		if (!model.textField?.charLimit) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(`Text field char limit must be at least 1.`);
		}

		const textInputType =
			model.type === DynamicFieldType.TextAreaField ? TextFieldType.TextArea : TextFieldType.SingleLine;

		if (entity) {
			entity.name = model.name;
			entity.charLimit = model.textField.charLimit;
			entity.isMandatory = model.isMandatory;
			entity.inputType = textInputType;

			return entity;
		}

		return TextDynamicField.create(
			model.serviceId,
			model.name,
			model.textField.charLimit,
			model.isMandatory,
			textInputType,
		);
	}

	private mapToDateOnlyField(model: PersistDynamicFieldModelV1, entity: DateOnlyDynamicField | null): DynamicField {
		if (entity) {
			entity.name = model.name;
			entity.isMandatory = model.isMandatory;

			return entity;
		}

		return DateOnlyDynamicField.create(model.serviceId, model.name, entity.isMandatory);
	}

	private getDefaultMyInfoName(myInfoFieldType: MyInfoFieldType): string {
		const name = DEFAULT_MYINFO_NAMES[myInfoFieldType];
		if (!name) throw new Error(`Default name not found for: ${myInfoFieldType}`);
		return name;
	}

	private mapToMyInfo(model: PersistDynamicFieldModelV1, entity: MyInfoDynamicField | null): DynamicField {
		const name = model.name || this.getDefaultMyInfoName(model.myInfoFieldType);

		if (entity) {
			if (model.myInfoFieldType !== entity.myInfoFieldType) {
				throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(
					`Type for myInfo field ${entity.name} cannot be changed once is set.`,
				);
			}

			entity.name = name;
			return entity;
		}

		return MyInfoDynamicField.create(model.serviceId, name, model.myInfoFieldType);
	}

	public mapToEntity(model: PersistDynamicFieldModelV1, existingEntity: DynamicField | null): DynamicField {
		let entity: DynamicField | null;
		if (existingEntity) {
			const [valid, validatedEntity] = this.checkExpectedEntityType(model, existingEntity);
			if (valid) {
				entity = validatedEntity;
			} else {
				throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(
					`Type for field ${existingEntity.name} cannot be changed from [${existingEntity.constructor.name}] to the requested value.`,
				);
			}
		}

		if (model.myInfoFieldType) {
			return this.mapToMyInfo(model, safeCast(entity, MyInfoDynamicField));
		}

		model.name = model.name?.trim();
		if (!model.name) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(`Name must be specified for custom field.`);
		}

		if (!model.type) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(
				`Type must be specified for custom field: ${model.name}.`,
			);
		}

		switch (model.type) {
			case DynamicFieldType.SelectList:
				return this.mapToSelectListField(model, safeCast(entity, SelectListDynamicField));
			case DynamicFieldType.RadioList:
				return this.mapToRadioListField(model, safeCast(entity, RadioListDynamicField));
			case DynamicFieldType.CheckboxList:
				return this.mapToCheckboxListField(model, safeCast(entity, CheckboxListDynamicField));
			case DynamicFieldType.TextField:
			case DynamicFieldType.TextAreaField:
				return this.mapToTextField(model, safeCast(entity, TextDynamicField));
			case DynamicFieldType.DateOnlyField:
				return this.mapToDateOnlyField(model, safeCast(entity, DateOnlyDynamicField));
			default:
				throw new Error(`DynamicFieldsMapper.mapToEntity not implemented for type: ${model.type}`);
		}
	}
}

@Scoped(Scope.Local)
class DynamicFieldMapperVisitor implements IDynamicFieldVisitor {
	@Inject
	private containerContext: ContainerContext;
	@Inject
	private myInfoMetadata: MyInfoMetadataFactory;
	@Inject
	private _idHasher: IdHasher;

	private _result: DynamicFieldModel;

	private mapFieldWithOptions({ options }: { options: DynamicKeyValueOption[] }): FieldWithOptionsModel {
		const fieldWithOptions = new FieldWithOptionsModel();
		fieldWithOptions.options = options.map((o) => DynamicOptionModel.create(o.key, o.value));
		return fieldWithOptions;
	}

	visitSelectList(_selectListField: SelectListDynamicField): void {
		this._result.type = DynamicFieldType.SelectList;
		this._result.selectList = this.mapFieldWithOptions(_selectListField);
	}

	visitRadioList(_radioListField: RadioListDynamicField): void {
		this._result.type = DynamicFieldType.RadioList;
		this._result.radioList = this.mapFieldWithOptions(_radioListField);
	}

	visitCheckboxList(_checkboxListField: CheckboxListDynamicField): void {
		this._result.type = DynamicFieldType.CheckboxList;
		this._result.checkboxList = this.mapFieldWithOptions(_checkboxListField);
	}

	visitTextField(_textField: TextDynamicField): void {
		this._result.type =
			_textField.inputType === TextFieldType.TextArea
				? DynamicFieldType.TextAreaField
				: DynamicFieldType.TextField;
		this._result.textField = new TextFieldModel();
		this._result.textField.charLimit = _textField.charLimit;
	}

	visitDateOnlyField(_dateOnlyField: DateOnlyDynamicField): void {
		this._result.type = DynamicFieldType.DateOnlyField;
	}

	visitMyInfo(_myInfoDynamicField: MyInfoDynamicField): void {
		const metadata = this.myInfoMetadata.getFieldMetadata(_myInfoDynamicField);
		const metadataVisitor = this.containerContext.resolve(DynamicFieldMapperVisitor);

		const metadataResult = metadataVisitor.mapDataModel(metadata);
		this._result = cloneDeep(metadataResult);
		this._result.myInfoFieldType = _myInfoDynamicField.myInfoFieldType;
		this._result.isCitizenReadonly = this.myInfoMetadata.isCitizenReadonly(_myInfoDynamicField);
	}

	public mapDataModel(field: DynamicField): DynamicFieldModel | undefined {
		if (!field || !field.id) return undefined;

		this._result = new DynamicFieldModel();
		this._result.idSigned = this._idHasher.encode(field.id);
		this._result.name = field.name;
		this._result.isMandatory = field.isMandatory;

		field.acceptVisitor(this);

		return this._result;
	}
}
