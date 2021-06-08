import { CitizenAuthGroup } from '../../../infrastructure/auth/authGroup';
import { UserContext } from '../../../infrastructure/auth/userContext';
import { UserContextMock } from '../../../infrastructure/auth/__mocks__/userContext';
import { Container } from 'typescript-ioc';
import { DynamicFieldsRepository } from '../dynamicFields.repository';
import { SelectListDynamicField, User } from '../../../models';
import { TransactionManager } from '../../../core/transactionManager';
import { SelectQueryBuilder } from 'typeorm';
import { UserConditionParams } from '../../../infrastructure/auth/authConditionCollection';
import { ServicesQueryAuthVisitor } from '../../../components/services/services.auth';
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

	it('should return valid query result', async () => {
		const dynamicFields: SelectListDynamicField[] = [];
		const queryBuilderMock = ({
			where: jest.fn(() => queryBuilderMock),
			leftJoin: jest.fn(() => queryBuilderMock),
			getMany: jest.fn(() => Promise.resolve(dynamicFields)),
		} as unknown) as SelectQueryBuilder<SelectListDynamicField>;
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
		const queryBuilderMock = ({
			where: jest.fn(() => queryBuilderMock),
			leftJoin: jest.fn(() => queryBuilderMock),
			getMany: jest.fn(() => Promise.resolve(dynamicFields)),
		} as unknown) as SelectQueryBuilder<SelectListDynamicField>;
		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);

		const container = Container.get(DynamicFieldsRepository);
		const dynamicFieldsResult = await container.getServiceFields({ serviceId: 1, skipAuthorisation: true });
		expect(QueryAuthVisitorMock.createUserVisibilityCondition).not.toBeCalled();
		expect(queryBuilderMock.where).toBeCalledWith('(field."_serviceId" = :serviceId)', { serviceId: 1 });
		expect(queryBuilderMock.getMany).toBeCalled();
		expect(dynamicFieldsResult).toEqual([]);
	});
});
