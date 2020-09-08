import { Container } from 'typescript-ioc';
import { UnavailabilitiesRepository } from '../unavailabilities.repository';
import { Unavailability } from '../../../models';
import { SelectQueryBuilder } from 'typeorm';
import { TransactionManager } from '../../../core/transactionManager';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

beforeAll(() => {
	Container.bind(TransactionManager).to(TransactionManagerMock);
});

describe('Unavailabilities repository', () => {
	afterEach(() => {
		jest.resetAllMocks();
	});

	it('should save an unavailability', async () => {
		const entry = Unavailability.create();
		entry.id = 1;

		TransactionManagerMock.save.mockImplementation(() => Promise.resolve(entry));
		const repository = Container.get(UnavailabilitiesRepository);

		const saved = await repository.save(entry);
		expect(TransactionManagerMock.save).toHaveBeenCalled();
		expect(saved).toBeDefined();
	});

	it('should retrieve unavailabilities for a service', async () => {
		const queryBuilderMock = ({
			where: jest.fn(() => queryBuilderMock),
			leftJoinAndSelect: jest.fn(() => queryBuilderMock),
			getMany: jest.fn(() => Promise.resolve([])),
		} as unknown) as SelectQueryBuilder<Unavailability>;

		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);

		const repository = Container.get(UnavailabilitiesRepository);

		const results = await repository.search({
			from: new Date(),
			to: new Date(),
			serviceId: 1,
		});

		const whereParam = '(u."_serviceId" = :serviceId) AND (u."_start" < :to AND u."_end" > :from)';
		expect((queryBuilderMock.where as jest.Mock).mock.calls[0][0]).toBe(whereParam);
		expect(queryBuilderMock.leftJoinAndSelect).toHaveBeenCalled();
		expect(queryBuilderMock.getMany).toHaveBeenCalled();
		expect(results).toBeDefined();
	});

	it('should count unavailabilities for a service', async () => {
		const queryBuilderMock = ({
			where: jest.fn(() => queryBuilderMock),
			leftJoinAndSelect: jest.fn(() => queryBuilderMock),
			getMany: jest.fn(() => Promise.resolve([])),
			getCount: jest.fn(() => Promise.resolve(1)),
		} as unknown) as SelectQueryBuilder<Unavailability>;

		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);

		const repository = Container.get(UnavailabilitiesRepository);

		const count = await repository.searchCount({
			from: new Date(),
			to: new Date(),
			serviceId: 1,
		});

		const whereParam = '(u."_serviceId" = :serviceId) AND (u."_start" < :to AND u."_end" > :from)';
		expect((queryBuilderMock.where as jest.Mock).mock.calls[0][0]).toBe(whereParam);
		expect(queryBuilderMock.getCount).toHaveBeenCalled();
		expect(count).toBe(1);
	});

	it('should retrieve unavailabilities for a service provider', async () => {
		const queryBuilderMock = ({
			where: jest.fn(() => queryBuilderMock),
			leftJoinAndSelect: jest.fn(() => queryBuilderMock),
			getMany: jest.fn(() => Promise.resolve([])),
		} as unknown) as SelectQueryBuilder<Unavailability>;

		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);

		const repository = Container.get(UnavailabilitiesRepository);

		const results = await repository.search({
			from: new Date(),
			to: new Date(),
			serviceId: 1,
			serviceProviderId: 2,
		});

		const whereParam =
			'(u."_serviceId" = :serviceId) AND (u."_start" < :to AND u."_end" > :from) AND ((u."_allServiceProviders" AND EXISTS(SELECT 1 FROM public.service_provider esp WHERE esp."_id" = :serviceProviderId AND esp."_serviceId" = u."_serviceId")) OR EXISTS(SELECT 1 FROM public.unavailable_service_provider usp WHERE usp."unavailability_id" = u."_id" AND usp."serviceProvider_id" = :serviceProviderId))';
		expect((queryBuilderMock.where as jest.Mock).mock.calls[0][0]).toBe(whereParam);
		expect(queryBuilderMock.leftJoinAndSelect).toHaveBeenCalled();
		expect(queryBuilderMock.getMany).toHaveBeenCalled();
		expect(results).toBeDefined();
	});
});

class TransactionManagerMock extends TransactionManager {
	public static save = jest.fn();
	public static find = jest.fn();
	public static findOne = jest.fn();
	public static createQueryBuilder = jest.fn();

	public async getEntityManager(): Promise<any> {
		const entityManager = {
			getRepository: () => ({
				find: TransactionManagerMock.find,
				findOne: TransactionManagerMock.findOne,
				save: TransactionManagerMock.save,
				createQueryBuilder: TransactionManagerMock.createQueryBuilder,
			}),
		};
		return Promise.resolve(entityManager);
	}
}
