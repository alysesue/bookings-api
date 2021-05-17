import { DynamicField, SelectListDynamicField, SelectListOption } from '../../models';
import { Inject, InRequestScope } from 'typescript-ioc';
import {
	DynamicFieldModel,
	DynamicFieldType,
	SelectListModel,
	SelectListOptionModel,
	TextFieldModel,
} from './dynamicFields.apicontract';
import { IdHasher } from '../../infrastructure/idHasher';
import { IDynamicFieldVisitor, TextDynamicField } from '../../models/entities/dynamicField';

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
