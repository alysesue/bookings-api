import { AsyncFunction, TransactionManager } from '../transactionManager';
import { IsolationLevel } from 'typeorm/driver/types/IsolationLevel';

export class TransactionManagerMock implements Partial<TransactionManager> {
	public static save = jest.fn();
	public static find = jest.fn();
	public static runInTransaction = jest.fn();

	public async getEntityManager(): Promise<any> {
		const entityManager = {
			getRepository: () => ({
				save: TransactionManagerMock.save,
				find: TransactionManagerMock.find,
			}),
		};
		return Promise.resolve(entityManager);
	}

	public async runInTransaction<T>(isolationLevel: IsolationLevel, asyncFunction: AsyncFunction<T>): Promise<T> {
		return TransactionManagerMock.runInTransaction(isolationLevel, asyncFunction);
	}
}
