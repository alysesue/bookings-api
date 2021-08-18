import { DynamicField, Service } from '../../models';
import { Inject, InRequestScope } from 'typescript-ioc';
import { DynamicFieldsRepository } from './dynamicFields.repository';
import { PersistDynamicFieldModel } from './dynamicFields.apicontract';
import { DynamicFieldsMapper } from './dynamicFields.mapper';
import { ServicesService } from '../services/services.service';
import { VisitorCrudAction } from '../../enums/crudAction';
import { DynamicFieldsActionAuthVisitor } from './dynamicFields.auth';
import { UserContext } from '../../infrastructure/auth/userContext';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { IdHasher } from '../../infrastructure/idHasher';

@InRequestScope
export class DynamicFieldsService {
	@Inject
	private mapper: DynamicFieldsMapper;
	@Inject
	public repository: DynamicFieldsRepository;
	@Inject
	public servicesService: ServicesService;
	@Inject
	private userContext: UserContext;
	@Inject
	private idHasher: IdHasher;

	private async verifyActionPermission(service: Service, action: VisitorCrudAction): Promise<void> {
		const authGroups = await this.userContext.getAuthGroups();
		if (!new DynamicFieldsActionAuthVisitor(service, action).hasPermission(authGroups)) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_AUTHORIZATION).setMessage(
				`User cannot perform this action (${action}) for dynamic fields.`,
			);
		}
	}

	public async save(model: PersistDynamicFieldModel): Promise<DynamicField> {
		const service = await this.servicesService.getService(model.serviceId);
		await this.verifyActionPermission(service, VisitorCrudAction.Create);

		if (model.isMandatory === undefined || null) {
			model.isMandatory = false;
		}
		const entity = this.mapper.mapToEntity(model, null);
		return await this.repository.save(entity);
	}

	public async update(model: PersistDynamicFieldModel): Promise<DynamicField> {
		const id = this.idHasher.decode(model.idSigned);
		const field = await this.repository.get({ id });
		if (!field) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage(`Dynamic field not found.`);
		}

		const service = await this.servicesService.getService(field.serviceId);
		await this.verifyActionPermission(service, VisitorCrudAction.Update);

		if (model.isMandatory === undefined || null) {
			model.isMandatory = field.isMandatory;
		}
		const entity = this.mapper.mapToEntity(model, field);
		return await this.repository.save(entity);
	}

	public async getServiceFields(serviceId: number): Promise<DynamicField[]> {
		return await this.repository.getServiceFields({
			serviceId,
		});
	}

	public async delete(idSigned: string): Promise<void> {
		const id = this.idHasher.decode(idSigned);
		const field = await this.repository.get({ id });
		if (!field) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage(`Dynamic field not found.`);
		}

		const service = await this.servicesService.getService(field.serviceId);
		await this.verifyActionPermission(service, VisitorCrudAction.Delete);

		return await this.repository.delete(field);
	}
}
