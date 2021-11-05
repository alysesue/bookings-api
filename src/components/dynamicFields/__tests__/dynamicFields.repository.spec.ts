import { CitizenAuthGroup } from '../../../infrastructure/auth/authGroup';
import { UserContext } from '../../../infrastructure/auth/userContext';
import { UserContextMock } from '../../../infrastructure/auth/__mocks__/userContext';
import { Container } from 'typescript-ioc';
import { DynamicFieldsRepository } from '../dynamicFields.repository';
import { DynamicField, SelectListDynamicField, TextDynamicField, User } from '../../../models';
import { TransactionManager } from '../../../core/transactionManager';
import { SelectQueryBuilder } from 'typeorm';
import { UserConditionParams } from '../../../infrastructure/auth/authConditionCollection';
import { ServicesQueryAuthVisitor } from '../../services/services.auth';
import { TransactionManagerMock } from '../../../core/__mocks__/transactionManager.mock';

jest.mock('../../../components/services/services.auth');

beforeAll(() => {
	Container.bind(UserContext).to(UserContextMock);
	Container.bind(TransactionManager).to(TransactionManagerMock);
});

const singpassUserMock = User.createSingPassUser('d080f6ed-3b47-478a-a6c6-dfb5608a199d', 'ABC1234');

describe('dynamicFields/dynamicFields.repository', () => {
	const QueryAuthVisitorMock = {
		createUserVisibilityCondition: jest.fn<Promise<UserConditionParams>, any>(),
	};
	beforeEach(() => {
		jest.resetAllMocks();
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new CitizenAuthGroup(singpassUserMock)]),
		);
		(ServicesQueryAuthVisitor as jest.Mock).mockImplementation(() => QueryAuthVisitorMock);
		QueryAuthVisitorMock.createUserVisibilityCondition.mockImplementation(() =>
			Promise.resolve({ userCondition: '', userParams: {} }),
		);
	});

	it('should save dynamic field', async () => {
		const field = TextDynamicField.create(2, 'Notes', 50, true);
		TransactionManagerMock.entityManager.save.mockReturnValue(Promise.resolve({}));

		const container = Container.get(DynamicFieldsRepository);
		const result = await container.save(field);

		expect(TransactionManagerMock.entityManager.save).toBeCalled();
		expect(result).toBeDefined();
	});

	it('should get dynamic field', async () => {
		const entity = TextDynamicField.create(1, 'notes', 50, true);
		entity.id = 11;

		const queryBuilderMock = {
			where: jest.fn(() => queryBuilderMock),
			leftJoin: jest.fn(() => queryBuilderMock),
			leftJoinAndSelect: jest.fn(() => queryBuilderMock),
			getOne: jest.fn(() => Promise.resolve(entity)),
		} as unknown as SelectQueryBuilder<DynamicField>;
		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);
		QueryAuthVisitorMock.createUserVisibilityCondition.mockImplementation(() =>
			Promise.resolve({ userCondition: 'field."_serviceId" = :testAuthId', userParams: { testAuthId: 2 } }),
		);

		const container = Container.get(DynamicFieldsRepository);
		const dynamicFieldsResult = await container.get({ id: 11 });

		expect(QueryAuthVisitorMock.createUserVisibilityCondition).toBeCalled();
		expect(queryBuilderMock.where).toBeCalledWith('(field."_serviceId" = :testAuthId) AND (field."_id" = :id)', {
			id: 11,
			testAuthId: 2,
		});
		expect(queryBuilderMock.getOne).toBeCalled();
		expect(dynamicFieldsResult).toEqual(entity);
	});

	it('should delete dynamic field', async () => {
		const field = TextDynamicField.create(2, 'Notes', 50, true);
		field.id = 11;

		TransactionManagerMock.softDelete.mockReturnValue(Promise.resolve());

		const instance = Container.get(DynamicFieldsRepository);
		await instance.delete(field);

		expect(TransactionManagerMock.softDelete).toBeCalledWith(11);
	});

	it('should return valid query result', async () => {
		const dynamicFields: DynamicField[] = [];
		const queryBuilderMock = {
			where: jest.fn(() => queryBuilderMock),
			leftJoin: jest.fn(() => queryBuilderMock),
			leftJoinAndSelect: jest.fn(() => queryBuilderMock),
			getMany: jest.fn(() => Promise.resolve(dynamicFields)),
		} as unknown as SelectQueryBuilder<DynamicField>;
		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);
		QueryAuthVisitorMock.createUserVisibilityCondition.mockImplementation(() =>
			Promise.resolve({ userCondition: 'field."_serviceId" = :testAuthId', userParams: { testAuthId: 2 } }),
		);

		const container = Container.get(DynamicFieldsRepository);
		const dynamicFieldsResult = await container.getServiceFields({ serviceId: 1 });
		expect(QueryAuthVisitorMock.createUserVisibilityCondition).toBeCalled();
		expect(queryBuilderMock.where).toBeCalledWith(
			'(field."_serviceId" = :testAuthId) AND (field."_serviceId" = :serviceId)',
			{
				serviceId: 1,
				testAuthId: 2,
			},
		);
		expect(queryBuilderMock.getMany).toBeCalled();
		expect(dynamicFieldsResult).toEqual([]);
	});

	it('test skip authorization true', async () => {
		const dynamicFields: SelectListDynamicField[] = [];
		const queryBuilderMock = {
			where: jest.fn(() => queryBuilderMock),
			leftJoin: jest.fn(() => queryBuilderMock),
			leftJoinAndSelect: jest.fn(() => queryBuilderMock),
			getMany: jest.fn(() => Promise.resolve(dynamicFields)),
		} as unknown as SelectQueryBuilder<SelectListDynamicField>;
		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);

		const container = Container.get(DynamicFieldsRepository);
		const dynamicFieldsResult = await container.getServiceFields({ serviceId: 1, skipAuthorisation: true });
		expect(QueryAuthVisitorMock.createUserVisibilityCondition).not.toBeCalled();
		expect(queryBuilderMock.where).toBeCalledWith('(field."_serviceId" = :serviceId)', { serviceId: 1 });
		expect(queryBuilderMock.getMany).toBeCalled();
		expect(dynamicFieldsResult).toEqual([]);
	});
});
