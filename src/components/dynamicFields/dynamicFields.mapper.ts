import { DynamicField, SelectListDynamicField, SelectListOption } from '../../models';
import { Inject, InRequestScope } from 'typescript-ioc';
import {
	DynamicFieldModel,
	DynamicFieldType,
	PersistDynamicFieldModel,
	SelectListModel,
	SelectListOptionModel,
	TextFieldModel,
} from './dynamicFields.apicontract';
import { IdHasher } from '../../infrastructure/idHasher';
import { IDynamicFieldVisitor, TextDynamicField } from '../../models/entities/dynamicField';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { groupByKeyLastValue } from '../../tools/collections';

@InRequestScope
export class DynamicFieldsMapper {
	@Inject
	private idHasher: IdHasher;

	public mapDataModels(entries: DynamicField[]): DynamicFieldModel[] {
		return entries.map((e) => this.mapDataModel(e));
	}

	public mapDataModel(field: DynamicField): DynamicFieldModel {
		return new DynamicFieldMapperVisitor(this.idHasher).mapDataModel(field);
	}

	private checkExpectedEntityType(type: DynamicFieldType, entity: DynamicField): boolean {
		switch (type) {
			case DynamicFieldType.SelectList:
				return entity instanceof SelectListDynamicField;
			case DynamicFieldType.TextField:
				return entity instanceof TextDynamicField;
			default:
				throw new Error(`DynamicFieldsMapper.checkExpectedEntityType not implemented for type: ${type}`);
		}
	}

	private mapToSelectListField(model: PersistDynamicFieldModel, entity: SelectListDynamicField | null): DynamicField {
		if (!model.selectList?.options?.length) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(
				`Select list field must contain at least one option.`,
			);
		}

		// ensures key uniqueness
		const options = Array.from(groupByKeyLastValue(model.selectList.options, (o) => o.key).values());

		if (entity) {
			entity.name = model.name;
			entity.options = options;
			return entity;
		}

		return SelectListDynamicField.create(model.serviceId, model.name, options);
	}

	private mapToTextField(model: PersistDynamicFieldModel, entity: TextDynamicField | null): DynamicField {
		if (!model.textField?.charLimit) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(`Text field char limit must be at least 1.`);
		}

		if (entity) {
			entity.name = model.name;
			entity.charLimit = model.textField.charLimit;
			return entity;
		}

		return TextDynamicField.create(model.serviceId, model.name, model.textField.charLimit);
	}

	public mapToEntity(model: PersistDynamicFieldModel, entity: DynamicField | null): DynamicField {
		if (entity) {
			const valid = this.checkExpectedEntityType(model.type, entity);
			if (!valid) {
				throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(
					`Type for field ${entity.name} cannot be changed once is set.`,
				);
			}
		}

		switch (model.type) {
			case DynamicFieldType.SelectList:
				return this.mapToSelectListField(model, entity as SelectListDynamicField);
			case DynamicFieldType.TextField:
				return this.mapToTextField(model, entity as TextDynamicField);
			default:
				throw new Error(`DynamicFieldsMapper.mapToEntity not implemented for type: ${model.type}`);
		}
	}
}

class DynamicFieldMapperVisitor implements IDynamicFieldVisitor {
	private readonly _idHasher: IdHasher;
	private _result: DynamicFieldModel;

	constructor(idHasher: IdHasher) {
		this._idHasher = idHasher;
	}

	private mapSelectListOption(o: SelectListOption): SelectListOptionModel {
		const obj = new SelectListOptionModel();
		obj.key = o.key;
		obj.value = o.value;
		return obj;
	}

	visitSelectList(_selectListField: SelectListDynamicField) {
		this._result.type = DynamicFieldType.SelectList;
		this._result.selectList = new SelectListModel();
		this._result.selectList.options = _selectListField.options.map((o) => this.mapSelectListOption(o));
	}

	visitTextField(_textField: TextDynamicField) {
		this._result.type = DynamicFieldType.TextField;
		this._result.textField = new TextFieldModel();
		this._result.textField.charLimit = _textField.charLimit;
	}

	public mapDataModel(field: DynamicField): DynamicFieldModel | undefined {
		if (!field || !field.id) return undefined;

		this._result = new DynamicFieldModel();
		this._result.idSigned = this._idHasher.encode(field.id);
		this._result.name = field.name;

		field.acceptVisitor(this);

		return this._result;
	}
}
