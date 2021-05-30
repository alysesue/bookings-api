import { Inject, InRequestScope } from 'typescript-ioc';
import { RepositoryBase } from '../../core/repository';
import { Label, LabelCategory, Service } from '../../models/entities';
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
		if (!data.length) return;
		await repository.delete(data.map((label) => label.id));
	}

	public async save(data: Label[]): Promise<Label[]> {
		const repository = await this.getRepository();
		return repository.save(data);
	}

	public async find(options: {
		serviceId?: number;
		categoryId?: number;
		skipAuthorisation?: boolean;
	}): Promise<Label[]> {
		const { serviceId, categoryId } = options;
		const authGroups = await this.userContext.getAuthGroups();

		const { userCondition, userParams } = options.skipAuthorisation
			? { userCondition: '', userParams: {} }
			: await new ServicesQueryAuthVisitor('servicelabel').createUserVisibilityCondition(authGroups);

		const repository = await this.getRepository();
		const serviceCondition = serviceId ? 'label."_serviceId" = :serviceId' : '';
		const categoryCondition = categoryId ? 'label."_categoryId" = :categoryId' : '';

		return repository
			.createQueryBuilder('label')
			.where(andWhere([serviceCondition, categoryCondition, userCondition]), {
				serviceId,
				categoryId,
				...userParams,
			})
			.leftJoin('label.service', 'servicelabel')
			.leftJoin('label.category', 'categorylabel')
			.getMany();
	}

	public async populateLabelForCategories<T extends LabelCategory>(entries: T[]): Promise<T[]> {
		return Promise.all(
			entries.map(async (s) => {
				s.labels = await this.find({ categoryId: s.id, skipAuthorisation: true });
				return s;
			}),
		);
	}

	public async populateLabelForService<T extends Service>(entries: T[]): Promise<T[]> {
		return Promise.all(
			entries.map(async (s) => {
				s.labels = await this.find({ serviceId: s.id });
				return s;
			}),
		);
	}
}
