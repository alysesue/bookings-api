import { OrganisationsNoauthRepository } from '../organisations.noauth.repository';
import { Container } from 'typescript-ioc';
import { AsyncFunction, TransactionManager } from '../../../core/transactionManager';
import { Organisation } from '../../../models/entities/organisation';
import { OrganisationsService } from '../organisations.service';
import { OrganisationAdminGroupMap } from '../../../models/entities/organisationAdminGroupMap';
import { IsolationLevel } from 'typeorm/driver/types/IsolationLevel';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

describe('Organisations service', () => {
	beforeEach(() => {
		jest.resetAllMocks();

		TransactionManagerMock.runInTransaction.mockImplementation(
			async <T extends unknown>(_isolationLevel: IsolationLevel, asyncFunction: AsyncFunction<T>): Promise<T> =>
				await asyncFunction(),
		);
	});

	beforeAll(() => {
		Container.bind(OrganisationsNoauthRepository).to(OrganisationsRepositoryMock);
		Container.bind(TransactionManager).to(TransactionManagerMock);
	});

	const organisationAdminGroupMapMock = new OrganisationAdminGroupMap();
	organisationAdminGroupMapMock.organisationId = 1;
	organisationAdminGroupMapMock.organisationRef = 'Test';

	const organisationMock = new Organisation();
	organisationMock.id = 1;
	organisationMock.name = 'mock organisation';
	organisationMock._organisationAdminGroupMap = organisationAdminGroupMapMock;

	it('should get organisations for groups with org', async () => {
		OrganisationsRepositoryMock.getOrganisationsForUserGroups.mockReturnValue(Promise.resolve([organisationMock]));

		const service = Container.get(OrganisationsService);
		const result = await service.getOrganisationsForGroups([{ organisationRef: 'Test' }]);
		expect(result).toEqual([organisationMock]);
	});

	it('should get organisations for groups', async () => {
		const mockData = [];
		OrganisationsRepositoryMock.getOrganisationsForUserGroups.mockImplementation(() => {
			return Promise.resolve(mockData);
		});
		OrganisationsRepositoryMock.save.mockImplementation(() => {
			mockData.push(organisationMock);
			return Promise.resolve(organisationMock);
		});

		const service = Container.get(OrganisationsService);
		const result = await service.getOrganisationsForGroups([{ organisationRef: 'Test' }]);
		expect(OrganisationsRepositoryMock.getOrganisationsForUserGroups).toBeCalled();
		expect(OrganisationsRepositoryMock.save).toBeCalled();
		expect(result).toBeDefined();
		expect(result.length).toBeGreaterThan(0);
	});
});

class OrganisationsRepositoryMock implements Partial<OrganisationsNoauthRepository> {
	public static getOrganisationsForUserGroups = jest.fn();
	public static sort = jest.fn();
	public static save = jest.fn<Promise<Organisation>, any>();

	public async getOrganisationsForUserGroups(...params): Promise<any> {
		return await OrganisationsRepositoryMock.getOrganisationsForUserGroups(...params);
	}
	public async sort(...params): Promise<any> {
		return await OrganisationsRepositoryMock.sort(...params);
	}
	public async save(...params): Promise<any> {
		return await OrganisationsRepositoryMock.save(...params);
	}
}

class TransactionManagerMock implements Partial<TransactionManager> {
	public static runInTransaction = jest.fn();

	public async runInTransaction(...params): Promise<any> {
		await TransactionManagerMock.runInTransaction(...params);
	}
}
