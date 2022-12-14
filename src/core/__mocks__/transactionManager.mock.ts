import { AsyncFunction, TransactionManager } from '../transactionManager';

export class TransactionManagerMock implements Partial<TransactionManager> {
	public static readonly entityManager = {
		save: jest.fn(),
		update: jest.fn(),
	};
	public static insert = jest.fn();
	public static find = jest.fn();
	public static findOne = jest.fn();
	public static getOne = jest.fn();
	public static update = jest.fn();
	public static save = jest.fn();
	public static delete = jest.fn();
	public static softDelete = jest.fn();
	public static query = jest.fn();
	public static createQueryBuilder = jest.fn();
	public static runInTransaction = jest.fn();
	public static orderBy = jest.fn();

	public async getEntityManager(): Promise<any> {
		const entityManager = {
			getRepository: () => ({
				find: TransactionManagerMock.find,
				findOne: TransactionManagerMock.findOne,
				insert: TransactionManagerMock.insert,
				update: TransactionManagerMock.update,
				save: TransactionManagerMock.save,
				delete: TransactionManagerMock.delete,
				softDelete: TransactionManagerMock.softDelete,
				query: TransactionManagerMock.query,
				orderBy: TransactionManagerMock.orderBy,
				createQueryBuilder: TransactionManagerMock.createQueryBuilder,
			}),
			...TransactionManagerMock.entityManager,
		};
		return Promise.resolve(entityManager);
	}

	public async runInTransaction<T>(isolationLevel: any, asyncFunction: AsyncFunction<T>): Promise<T> {
		return TransactionManagerMock.runInTransaction(isolationLevel, asyncFunction);
	}
}
