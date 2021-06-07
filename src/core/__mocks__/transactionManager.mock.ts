import { AsyncFunction, TransactionManager } from '../transactionManager';

export class TransactionManagerMock implements Partial<TransactionManager> {
	public static readonly entityManager = {
		save: jest.fn(),
	};
	public static insert = jest.fn();
	public static find = jest.fn();
	public static update = jest.fn();
	public static findOne = jest.fn();
	public static save = jest.fn();
	public static delete = jest.fn();
	public static query = jest.fn();
	public static createQueryBuilder = jest.fn();
	public static runInTransaction = jest.fn();

	public async getEntityManager(): Promise<any> {
		const entityManager = {
			getRepository: () => ({
				find: TransactionManagerMock.find,
				findOne: TransactionManagerMock.findOne,
				insert: TransactionManagerMock.insert,
				update: TransactionManagerMock.update,
				save: TransactionManagerMock.save,
				delete: TransactionManagerMock.delete,
				query: TransactionManagerMock.query,
				createQueryBuilder: TransactionManagerMock.createQueryBuilder,
			}),
			save: TransactionManagerMock.entityManager.save,
		};
		return Promise.resolve(entityManager);
	}

	public async runInTransaction<T>(isolationLevel: any, asyncFunction: AsyncFunction<T>): Promise<T> {
		return TransactionManagerMock.runInTransaction(isolationLevel, asyncFunction);
	}
}
