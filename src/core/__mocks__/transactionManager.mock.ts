import { TransactionManager } from '../transactionManager';

export class TransactionManagerMock implements Partial<TransactionManager> {
	public static save = jest.fn();
	public static find = jest.fn();

	public async getEntityManager(): Promise<any> {
		const entityManager = {
			getRepository: () => ({
				save: TransactionManagerMock.save,
				find: TransactionManagerMock.find,
			}),
		};
		return Promise.resolve(entityManager);
	}
}
