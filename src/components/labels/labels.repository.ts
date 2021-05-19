import { Inject, InRequestScope } from 'typescript-ioc';
import { RepositoryBase } from '../../core/repository';
import { Label } from '../../models/entities';
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

	public async delete(data: Label[]) {
		const repository = await this.getRepository();
		if (!data.length)
			return
		await repository.delete(data.map((label) => label.id));
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
