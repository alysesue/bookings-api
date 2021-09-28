import { Container } from 'typescript-ioc';
import { TransactionManager } from '../../../core/transactionManager';
import { SelectQueryBuilder } from 'typeorm/query-builder/SelectQueryBuilder';
import { TransactionManagerMock } from '../../../core/__mocks__/transactionManager.mock';
import {
	ServiceProviderLabelsCategoriesRepository,
	ServiceProviderLabelsRepository,
} from '../serviceProvidersLabels.repository';
import { Organisation, ServiceProviderLabel, ServiceProviderLabelCategory } from '../../../models/entities';

jest.mock('../../../core/transactionManager', () => {
	class TransactionManager {}
	return {
		TransactionManager,
	};
});

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

beforeAll(() => {
	Container.bind(TransactionManager).to(TransactionManagerMock);
});

describe('Service Providers Labels Repository', () => {
	const label1: ServiceProviderLabel = new ServiceProviderLabel();
	label1.labelText = 'label1';
	const label2: ServiceProviderLabel = new ServiceProviderLabel();
	label2.labelText = 'label2';

	const labelsToSave = [label1, label2];
	const savedLabels = [
		{ ...label1, id: 1 },
		{ ...label2, id: 2 },
	];
	let queryBuilderMock;
	beforeEach(() => {
		jest.resetAllMocks();

		queryBuilderMock = ({
			where: jest.fn(() => queryBuilderMock),
			leftJoin: jest.fn(() => queryBuilderMock),
			leftJoinAndSelect: jest.fn(() => queryBuilderMock),
			getMany: jest.fn(() => Promise.resolve(labelsToSave)),
		} as unknown) as SelectQueryBuilder<ServiceProviderLabel>;
	});

	describe('labels repository', () => {
		it('should save a label', async () => {
			const repository = Container.get(ServiceProviderLabelsRepository);
			TransactionManagerMock.save.mockImplementation(() => Promise.resolve(savedLabels));

			const res = await repository.save(labelsToSave);
			expect(res).toStrictEqual(savedLabels);
			expect(TransactionManagerMock.save.mock.calls[0][0]).toStrictEqual(labelsToSave);
		});

		it('should get labels', async () => {
			TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);
			const repository = Container.get(ServiceProviderLabelsRepository);
			const result = await repository.find({ organisationIds: [1] });
			expect(result).toBeDefined();
			expect(queryBuilderMock.getMany).toBeCalled();
		});

		it('should populate for categories', async () => {
			TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);
			const repository = Container.get(ServiceProviderLabelsRepository);
			const labelCategory = new ServiceProviderLabelCategory();
			labelCategory.id = 1;
			const result = await repository.populateLabelForCategories([labelCategory]);
			expect(result).toBeDefined();
			expect(queryBuilderMock.getMany).toBeCalled();
		});

		it('should populate for organisation', async () => {
			TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);
			const repository = Container.get(ServiceProviderLabelsRepository);
			const organisation = new Organisation();
			organisation.id = 1;
			const result = await repository.populateLabelForOrganisation([organisation]);
			expect(result).toBeDefined();
			expect(queryBuilderMock.getMany).toBeCalled();
		});
	});
});

describe('Service Providers Categories Repository', () => {
	describe('category repository', () => {
		const labelCat1: ServiceProviderLabelCategory = new ServiceProviderLabelCategory();
		labelCat1.name = 'Language';
		const labelCat2: ServiceProviderLabelCategory = new ServiceProviderLabelCategory();
		labelCat2.name = 'Country';

		const labelsCategoryToSave = [labelCat1, labelCat2];
		const savedLabelsCategories = [
			{ ...labelCat1, id: 1 },
			{ ...labelCat2, id: 2 },
		];
		let queryBuilderMock;

		beforeEach(() => {
			jest.resetAllMocks();

			queryBuilderMock = ({
				where: jest.fn(() => queryBuilderMock),
				leftJoin: jest.fn(() => queryBuilderMock),
				leftJoinAndSelect: jest.fn(() => queryBuilderMock),
				getMany: jest.fn(() => Promise.resolve(labelsCategoryToSave)),
			} as unknown) as SelectQueryBuilder<ServiceProviderLabelCategory>;
		});

		describe('Service Provider Labels Category Repository', () => {
			it('should save a label', async () => {
				const repository = Container.get(ServiceProviderLabelsCategoriesRepository);
				TransactionManagerMock.save.mockImplementation(() => Promise.resolve(savedLabelsCategories));

				const res = await repository.save(labelsCategoryToSave);
				expect(res).toStrictEqual(savedLabelsCategories);
				expect(TransactionManagerMock.save.mock.calls[0][0]).toStrictEqual(labelsCategoryToSave);
			});

			it('should get labels', async () => {
				TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);
				const repository = Container.get(ServiceProviderLabelsCategoriesRepository);
				const result = await repository.find({ organisationId: 1 });
				expect(result).toBeDefined();
				expect(queryBuilderMock.getMany).toBeCalled();
			});

			it('should populate for categories', async () => {
				TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);
				const repository = Container.get(ServiceProviderLabelsCategoriesRepository);
				const organisation = new Organisation();
				organisation.id = 1;
				const result = await repository.populateCategories([organisation]);
				expect(result).toBeDefined();
				expect(queryBuilderMock.getMany).toBeCalled();
			});
		});
	});
});
