import { EntityManager, Repository } from 'typeorm';
import { Inject } from 'typescript-ioc';
import { TransactionManager } from './transactionManager';

export abstract class RepositoryBase<T> {
	@Inject
	private transactionManager: TransactionManager;
	private readonly modelType;

	protected constructor(modelType) {
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

export enum QueryAccessType {
	Read = 1,
	Write,
}
