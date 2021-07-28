import { Label, LabelCategory, Service } from '../../../models/entities';
import { Container } from 'typescript-ioc';
import { TransactionManager } from '../../../core/transactionManager';
import { LabelsRepository } from '../labels.repository';
import { SelectQueryBuilder } from 'typeorm/query-builder/SelectQueryBuilder';
import { ServicesQueryAuthVisitor } from '../../../components/services/services.auth';
import { UserConditionParams } from '../../../infrastructure/auth/authConditionCollection';
import { TransactionManagerMock } from '../../../core/__mocks__/transactionManager.mock';
import { UserContext } from '../../../infrastructure/auth/userContext';
import { UserContextMock } from '../../../infrastructure/auth/__mocks__/userContext';

jest.mock('../../../components/services/services.auth');
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

const QueryAuthVisitorMock = {
	createUserVisibilityCondition: jest.fn<Promise<UserConditionParams>, any>(),
};

describe('labels/labels.repository', () => {
	const label1: Label = new Label();
	label1.labelText = 'label1';
	const label2: Label = new Label();
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
		} as unknown) as SelectQueryBuilder<Label>;
		(ServicesQueryAuthVisitor as jest.Mock).mockImplementation(() => QueryAuthVisitorMock);
		QueryAuthVisitorMock.createUserVisibilityCondition.mockImplementation(() =>
			Promise.resolve({ userCondition: '', userParams: {} }),
		);
		UserContextMock.getAuthGroups.mockReturnValue(Promise.resolve([]));
	});

	it('should save a label', async () => {
		const repository = Container.get(LabelsRepository);
		TransactionManagerMock.save.mockImplementation(() => Promise.resolve(savedLabels));

		const res = await repository.save(labelsToSave);
		expect(res).toStrictEqual(savedLabels);
		expect(TransactionManagerMock.save.mock.calls[0][0]).toStrictEqual(labelsToSave);
	});

	it('should get labels', async () => {
		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);
		const repository = Container.get(LabelsRepository);
		const result = await repository.find({ serviceIds: [1] });
		expect(result).toBeDefined();
		expect(queryBuilderMock.getMany).toBeCalled();
	});

	it('should populate for categories', async () => {
		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);
		const repository = Container.get(LabelsRepository);
		const labelCategory = new LabelCategory();
		labelCategory.id = 1;
		const result = await repository.populateLabelForCategories([labelCategory]);
		expect(result).toBeDefined();
		expect(queryBuilderMock.getMany).toBeCalled();
	});

	it('should populate for service', async () => {
		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);
		const repository = Container.get(LabelsRepository);
		const service = new Service();
		service.id = 1;
		const result = await repository.populateLabelForService([service]);
		expect(result).toBeDefined();
		expect(QueryAuthVisitorMock.createUserVisibilityCondition).toBeCalled();
		expect(queryBuilderMock.getMany).toBeCalled();
	});
});
