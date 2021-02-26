import { TransactionManager } from '../../core/transactionManager';

export const CreateQueryBuilder = jest.fn();
export const InnerRepositoryMock = {
	findOne: jest.fn().mockImplementation(() => Promise.resolve({})),
	find: jest.fn().mockImplementation(() => Promise.resolve([])),
	save: jest.fn().mockImplementation(() => Promise.resolve({})),
	delete: jest.fn().mockImplementation(() => Promise.resolve({})),
	createQueryBuilder: CreateQueryBuilder,
};
export const GetRepositoryMock = jest.fn().mockImplementation(() => InnerRepositoryMock);

export class TransactionManagerMock implements Partial<TransactionManager> {
	public async getEntityManager(): Promise<any> {
		const entityManager = {
			getRepository: GetRepositoryMock,
		};
		return Promise.resolve(entityManager);
	}
}
