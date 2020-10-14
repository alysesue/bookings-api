import { Container } from 'typescript-ioc';
import { ServiceProvider } from '../../../models';
import { TransactionManager } from '../../../core/transactionManager';
import { ServiceProvidersRepositoryNoAuth } from '../serviceProviders.noauth.repository';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

beforeAll(() => {
	Container.bind(TransactionManager).to(TransactionManagerMock);
});

describe('Service Provider repository', () => {
	const queryBuilderMock: {
		where: jest.Mock;
		leftJoin: jest.Mock;
		innerJoin: jest.Mock;
		leftJoinAndSelect: jest.Mock;
		getMany: jest.Mock<Promise<ServiceProvider[]>, any>;
		getOne: jest.Mock<Promise<ServiceProvider>, any>;
	} = {
		where: jest.fn(),
		leftJoin: jest.fn(),
		innerJoin: jest.fn(),
		leftJoinAndSelect: jest.fn(),
		getMany: jest.fn<Promise<ServiceProvider[]>, any>(),
		getOne: jest.fn<Promise<ServiceProvider>, any>(),
	};

	beforeEach(() => {
		jest.resetAllMocks();

		queryBuilderMock.where.mockImplementation(() => queryBuilderMock);
		queryBuilderMock.innerJoin.mockImplementation(() => queryBuilderMock);
		queryBuilderMock.leftJoinAndSelect.mockImplementation(() => queryBuilderMock);

		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);
	});

	it('should get list of SP', async () => {
		queryBuilderMock.getMany.mockImplementation(() => Promise.resolve([]));

		const spRepositoryNoAuth = Container.get(ServiceProvidersRepositoryNoAuth);

		await spRepositoryNoAuth.getServiceProviderByMolAdminId({ molAdminId: '1' });
		expect(TransactionManagerMock.createQueryBuilder).toBeCalled();
		expect(queryBuilderMock.getOne).toBeCalled();
	});
});

class TransactionManagerMock extends TransactionManager {
	public static insert = jest.fn();
	public static find = jest.fn();
	public static update = jest.fn();
	public static findOne = jest.fn();
	public static save = jest.fn();
	public static createQueryBuilder = jest.fn();

	public async getEntityManager(): Promise<any> {
		const entityManager = {
			getRepository: () => ({
				find: TransactionManagerMock.find,
				findOne: TransactionManagerMock.findOne,
				insert: TransactionManagerMock.insert,
				update: TransactionManagerMock.update,
				save: TransactionManagerMock.save,
				createQueryBuilder: TransactionManagerMock.createQueryBuilder,
			}),
		};
		return Promise.resolve(entityManager);
	}
}
