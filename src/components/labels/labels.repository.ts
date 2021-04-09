import { RepositoryBase } from '../../core/repository';
import { Label } from '../../models/entities';
import { Inject, InRequestScope } from 'typescript-ioc';
import { UserContext } from '../../infrastructure/auth/userContext';
import { andWhere } from '../../tools/queryConditions';
import { ServicesQueryAuthVisitor } from '../services/services.auth';

@InRequestScope
export class LabelsRepository extends RepositoryBase<Label> {
	@Inject
	private userContext: UserContext;

	constructor() {
		super(Label);
	}

	public async save(data: Label[]): Promise<Label[]> {
		const repository = await this.getRepository();
		return repository.save(data);
	}

	public async find(options: { serviceId: number; skipAuthorisation?: boolean }): Promise<Label[]> {
		const { serviceId } = options;
		const authGroups = await this.userContext.getAuthGroups();

		const { userCondition, userParams } = options.skipAuthorisation
			? { userCondition: '', userParams: {} }
			: await new ServicesQueryAuthVisitor('servicelabel').createUserVisibilityCondition(authGroups);

		const repository = await this.getRepository();
		const serviceCondition = 'label."_serviceId" = :serviceId';

		return repository
			.createQueryBuilder('label')
			.where(andWhere([serviceCondition, userCondition]), { serviceId, ...userParams })
			.leftJoin('label.service', 'servicelabel')
			.getMany();
	}
}
