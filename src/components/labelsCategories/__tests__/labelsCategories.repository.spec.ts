import { TransactionManager } from '../../../core/transactionManager';
import { TransactionManagerMock } from '../../../core/__mocks__/transactionManager.mock';
import { UserContext } from '../../../infrastructure/auth/userContext';
import { UserContextMock } from '../../../infrastructure/auth/__mocks__/userContext';
import { Container } from 'typescript-ioc';
import { SelectQueryBuilder } from 'typeorm';
import { LabelCategory, Service } from '../../../models';
import { LabelsCategoriesRepository } from '../labelsCategories.repository';

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
	Container.bind(UserContext).to(UserContextMock);
});

describe('labelsCategories repository', () => {
	describe('Service Labels Category Repository', () => {
		const labelCat1: LabelCategory = new LabelCategory();
		labelCat1.name = 'Language';
		const labelCat2: LabelCategory = new LabelCategory();
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
			} as unknown) as SelectQueryBuilder<LabelCategory>;
		});

		it('should save a label', async () => {
			const repository = Container.get(LabelsCategoriesRepository);
			TransactionManagerMock.save.mockImplementation(() => Promise.resolve(savedLabelsCategories));

			const res = await repository.save(labelsCategoryToSave);
			expect(res).toStrictEqual(savedLabelsCategories);
			expect(TransactionManagerMock.save.mock.calls[0][0]).toStrictEqual(labelsCategoryToSave);
		});

		it('should get labels', async () => {
			TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);
			const repository = Container.get(LabelsCategoriesRepository);
			const result = await repository.find({ serviceId: 1 });
			expect(result).toBeDefined();
			expect(queryBuilderMock.getMany).toBeCalled();
		});

		it('should populate for categories', async () => {
			TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);
			const repository = Container.get(LabelsCategoriesRepository);
			const labelCategory = new Service();
			labelCategory.id = 1;
			const result = await repository.populateCategories([labelCategory]);
			expect(result).toBeDefined();
			expect(queryBuilderMock.getMany).toBeCalled();
		});
	});
});
