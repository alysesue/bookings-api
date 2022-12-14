import { Container } from 'typescript-ioc';
import { ServiceProvider } from '../../../models';
import { TransactionManager } from '../../../core/transactionManager';
import { ServiceProvidersRepositoryNoAuth } from '../serviceProviders.noauth.repository';
import { TransactionManagerMock } from '../../../core/__mocks__/transactionManager.mock';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

beforeAll(() => {
	Container.bind(TransactionManager).to(TransactionManagerMock);
});

describe('Service Provider No Auth repository', () => {
	const queryBuilderMock: {
		where: jest.Mock;
		leftJoin: jest.Mock;
		leftJoinAndSelect: jest.Mock;
		innerJoin: jest.Mock;
		getMany: jest.Mock<Promise<ServiceProvider[]>, any>;
		getOne: jest.Mock<Promise<ServiceProvider>, any>;
	} = {
		where: jest.fn(),
		leftJoin: jest.fn(),
		leftJoinAndSelect: jest.fn(),
		innerJoin: jest.fn(),
		getMany: jest.fn<Promise<ServiceProvider[]>, any>(),
		getOne: jest.fn<Promise<ServiceProvider>, any>(),
	};

	beforeEach(() => {
		jest.resetAllMocks();

		queryBuilderMock.where.mockImplementation(() => queryBuilderMock);
		queryBuilderMock.leftJoin.mockImplementation(() => queryBuilderMock);
		queryBuilderMock.leftJoinAndSelect.mockImplementation(() => queryBuilderMock);
		queryBuilderMock.innerJoin.mockImplementation(() => queryBuilderMock);

		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);
	});

	it('should get service provider by molAdminId', async () => {
		const serviceProvider = ServiceProvider.create('a', 1);
		queryBuilderMock.getOne.mockImplementation(() => Promise.resolve(serviceProvider));

		const spRepository = Container.get(ServiceProvidersRepositoryNoAuth);

		const result = await spRepository.getServiceProviderByMolAdminId({
			molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
		});
		expect(TransactionManagerMock.createQueryBuilder).toBeCalled();
		expect(queryBuilderMock.getOne).toBeCalled();
		expect(result).toBeDefined();
	});

	it('should get return null service provider', async () => {
		const spRepository = Container.get(ServiceProvidersRepositoryNoAuth);

		const result = await spRepository.getServiceProviderByMolAdminId({ molAdminId: null });
		expect(result).toBeNull();
	});
});
