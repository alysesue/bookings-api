import { DynamicField, SelectListDynamicField, SelectListOption } from '../../models';
import { Inject, InRequestScope, Scope, Scoped } from 'typescript-ioc';
import {
	DynamicFieldModel,
	DynamicFieldType,
	PersistDynamicFieldModelV1,
	SelectListModel,
	SelectListOptionModel,
	TextFieldModel,
} from './dynamicFields.apicontract';
import { IdHasher } from '../../infrastructure/idHasher';
import {
	DateOnlyDynamicField,
	IDynamicFieldVisitor,
	MyInfoDynamicField,
	TextDynamicField,
} from '../../models/entities/dynamicField';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { groupByKeyLastValue } from '../../tools/collections';
import { DEFAULT_MYINFO_NAMES, MyInfoFieldType } from '../../models/entities/myInfoFieldType';
import { MyInfoMetadataFactory } from '../myInfo/myInfoMetadata';
import { cloneDeep } from 'lodash';
import { ContainerContext } from '../../infrastructure/containerContext';

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

	private checkExpectedEntityType(model: PersistDynamicFieldModelV1, entity: DynamicField): boolean {
		if (model.myInfoFieldType) {
			return entity instanceof MyInfoDynamicField;
		}

		switch (model.type) {
			case DynamicFieldType.SelectList:
				return entity instanceof SelectListDynamicField;
			case DynamicFieldType.TextField:
				return entity instanceof TextDynamicField;
			case DynamicFieldType.DateOnlyField:
				return entity instanceof DateOnlyDynamicField;
			default:
				throw new Error(`DynamicFieldsMapper.checkExpectedEntityType not implemented for type: ${model.type}`);
		}
	}

	private mapToSelectListField(
		model: PersistDynamicFieldModelV1,
		entity: SelectListDynamicField | null,
	): DynamicField {
		if (!model.selectList?.options?.length) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(
				`Select list field must contain at least one option.`,
			);
		}

		if (model.selectList.options.find((o: SelectListOptionModel) => o.key === 0)) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(
				`Select list field must not contain option with key 0.`,
			);
		}

		// ensures key uniqueness
		const options = Array.from(groupByKeyLastValue(model.selectList.options, (o) => o.key).values());

		if (entity) {
			entity.name = model.name;
			entity.options = options;
			entity.isMandatory = model.isMandatory;
			return entity;
		}

		return SelectListDynamicField.create(model.serviceId, model.name, options, model.isMandatory);
	}

	private mapToTextField(model: PersistDynamicFieldModelV1, entity: TextDynamicField | null): DynamicField {
		if (!model.textField?.charLimit) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(`Text field char limit must be at least 1.`);
		}

		if (entity) {
			entity.name = model.name;
			entity.charLimit = model.textField.charLimit;
			entity.isMandatory = model.isMandatory;

			return entity;
		}

		return TextDynamicField.create(model.serviceId, model.name, model.textField.charLimit, model.isMandatory);
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

	public mapToEntity(model: PersistDynamicFieldModelV1, entity: DynamicField | null): DynamicField {
		if (entity) {
			const valid = this.checkExpectedEntityType(model, entity);
			if (!valid) {
				throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(
					`Type for field ${entity.name} cannot be changed once is set.`,
				);
			}
		}

		if (model.myInfoFieldType) {
			return this.mapToMyInfo(model, entity as MyInfoDynamicField);
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
				return this.mapToSelectListField(model, entity as SelectListDynamicField);
			case DynamicFieldType.TextField:
				return this.mapToTextField(model, entity as TextDynamicField);
			case DynamicFieldType.DateOnlyField:
				return this.mapToDateOnlyField(model, entity as DateOnlyDynamicField);
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

	private mapSelectListOption(o: SelectListOption): SelectListOptionModel {
		const obj = new SelectListOptionModel();
		obj.key = o.key;
		obj.value = o.value;
		return obj;
	}

	visitSelectList(_selectListField: SelectListDynamicField): void {
		this._result.type = DynamicFieldType.SelectList;
		this._result.selectList = new SelectListModel();
		this._result.selectList.options = _selectListField.options.map((o) => this.mapSelectListOption(o));
	}

	visitTextField(_textField: TextDynamicField): void {
		this._result.type = DynamicFieldType.TextField;
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
