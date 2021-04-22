import { DynamicField } from '../../models';
import { Inject, InRequestScope } from 'typescript-ioc';
import { DynamicFieldsRepository } from './dynamicFields.repository';

@InRequestScope
export class DynamicFieldsService {
	@Inject
	public dynamicFieldsRepository: DynamicFieldsRepository;

	public async getServiceFields(serviceId: number): Promise<DynamicField[]> {
		return await this.dynamicFieldsRepository.getServiceFields({
			serviceId,
		});
	}
}
