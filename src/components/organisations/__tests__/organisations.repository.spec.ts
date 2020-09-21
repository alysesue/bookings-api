import { OrganisationsRepository } from '../organisations.repository';
import { Container } from 'typescript-ioc';
import { TransactionManager } from '../../../core/transactionManager';
import { Organisation } from '../../../models/entities/organisation';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

describe('Organisations repository', () => {
	beforeEach(() => {
		jest.resetAllMocks();
	});

	beforeAll(() => {
		Container.bind(TransactionManager).to(TransactionManagerMock);
	});

	const organisationMock = new Organisation();
	organisationMock.id = 1;
	organisationMock.name = 'mock organisation';

	it('should get organisations for user groups', async () => {
		const queryBuilderMock = {
			where: jest.fn(() => queryBuilderMock),
			innerJoinAndSelect: jest.fn(() => queryBuilderMock),
			getMany: jest.fn(() => Promise.resolve([organisationMock])),
		};
		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);

		const repository = Container.get(OrganisationsRepository);
		const result = await repository.getOrganisationsForUserGroups(['Organisation1']);
		expect(result).toEqual([organisationMock]);
	});


	it('should return empty', async () => {
		const queryBuilderMock = {
			where: jest.fn(() => queryBuilderMock),
			innerJoinAndSelect: jest.fn(() => queryBuilderMock),
			getMany: jest.fn(() => Promise.resolve([organisationMock])),
		};
		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);

		const repository = Container.get(OrganisationsRepository);
		const result = await repository.getOrganisationsForUserGroups([]);
		expect(result).toEqual([]);
	});

	it('should save organisation', async () => {
		const data = new Organisation();
		data.id = 1;
		data.name = "Organisation1";

		TransactionManagerMock.save.mockImplementation(() => Promise.resolve(data));
		const repository = Container.get(OrganisationsRepository);
		await repository.save(data);
		expect(TransactionManagerMock.save.mock.calls[0][0]).toStrictEqual(data);
	});
});

class TransactionManagerMock extends TransactionManager {
	public static createQueryBuilder = jest.fn();
	public static save = jest.fn();


	public async getEntityManager(): Promise<any> {
		const entityManager = {
			getRepository: () => ({
				createQueryBuilder: TransactionManagerMock.createQueryBuilder,
				save: TransactionManagerMock.save,
			}),
		};

		return Promise.resolve(entityManager);
	}
}
