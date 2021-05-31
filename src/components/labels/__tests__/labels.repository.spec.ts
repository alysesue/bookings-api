import { Label, LabelCategory, Service } from '../../../models/entities';
import { Container } from 'typescript-ioc';
import { TransactionManager } from '../../../core/transactionManager';
import { LabelsRepository } from '../labels.repository';
import { TransactionManagerMock } from '../../oneOffTimeslots/__tests__/oneOffTimeslots.repository.spec';
import { SelectQueryBuilder } from 'typeorm/query-builder/SelectQueryBuilder';
import { ServicesQueryAuthVisitor } from '../../../components/services/services.auth';
import { UserConditionParams } from '../../../infrastructure/auth/authConditionCollection';

jest.mock('../../../components/services/services.auth');

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

beforeAll(() => {
	Container.bind(TransactionManager).to(TransactionManagerMock);
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
		queryBuilderMock = ({
			where: jest.fn(() => queryBuilderMock),
			leftJoin: jest.fn(() => queryBuilderMock),
			getMany: jest.fn(() => Promise.resolve(labelsToSave)),
		} as unknown) as SelectQueryBuilder<Label>;
		(ServicesQueryAuthVisitor as jest.Mock).mockImplementation(() => QueryAuthVisitorMock);
		QueryAuthVisitorMock.createUserVisibilityCondition.mockImplementation(() =>
			Promise.resolve({ userCondition: '', userParams: {} }),
		);
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
		expect(QueryAuthVisitorMock.createUserVisibilityCondition).toBeCalled();
		expect(queryBuilderMock.getMany).toBeCalled();
	});

	it('should populate for categories', async () => {
		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);
		const repository = Container.get(LabelsRepository);
		const labelCategory = new LabelCategory();
		labelCategory.id = 1;
		const result = await repository.populateLabelForCategories([labelCategory]);
		expect(result).toBeDefined();
		expect(QueryAuthVisitorMock.createUserVisibilityCondition).toBeCalled();
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
