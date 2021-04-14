import { DynamicField, SelectListDynamicField, SelectListOption } from '../../models';
import { Inject, InRequestScope } from 'typescript-ioc';
import {
	DynamicFieldModel,
	DynamicFieldType,
	SelectListModel,
	SelectListOptionModel,
} from './dynamicFields.apicontract';
import { IdHasher } from '../../infrastructure/idHasher';

@InRequestScope
export class DynamicFieldsMapper {
	@Inject
	private idHasher: IdHasher;

	public mapDataModels(entries: DynamicField[]): DynamicFieldModel[] {
		return entries.map((e) => this.mapDataModel(e));
	}

	public mapDataModel(field: DynamicField): DynamicFieldModel {
		// Switch mapper implementation to a visitor when dynamic fields get more complicated.
		if (!field || !field.id) return;
		const obj = new DynamicFieldModel();
		obj.idSigned = this.idHasher.encode(field.id);
		obj.name = field.name;
		obj.type = DynamicFieldType.SelectList;
		obj.SelectList = new SelectListModel();
		obj.SelectList.options = (field as SelectListDynamicField).options.map((o) => this.mapOption(o));
		return obj;
	}

	private mapOption(o: SelectListOption): SelectListOptionModel {
		const obj = new SelectListOptionModel();
		obj.key = o.key;
		obj.value = o.value;
		return obj;
	}
}
