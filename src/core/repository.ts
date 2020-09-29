import { EntityManager, ObjectType, Repository } from 'typeorm';
import { Inject } from 'typescript-ioc';
import { TransactionManager } from './transactionManager';

export abstract class RepositoryBase<T> {
	@Inject
	private transactionManager: TransactionManager;
	private readonly modelType: ObjectType<T>;

	constructor(modelType: ObjectType<T>) {
		if (!modelType) {
			throw new Error('modelType parameter is required in RepositoryBase.');
		}

		this.modelType = modelType;
	}

	protected async getEntityManager(): Promise<EntityManager> {
		// dynamically resolves an EntityManager (may be part of a transaction)
		const transactionManager = this.transactionManager;
		return await transactionManager.getEntityManager();
	}

	protected async getRepository(): Promise<Repository<T>> {
		const entityManager = await this.getEntityManager();
		return entityManager.getRepository<T>(this.modelType);
	}
}
