import { LabelsServiceMock } from '../../../components/labels/__mocks__/labels.service.mock';
import { Container } from 'typescript-ioc';
import {
	Organisation,
	OrganisationAdminGroupMap,
	ServiceProviderLabel,
	ServiceProviderLabelCategory,
	User,
} from '../../../models/entities';
import { ServiceProviderLabelsRepository } from '../serviceProvidersLabels.repository';
import { OrganisationSPLabelsService, SPLabelsCategoriesService } from '../serviceProvidersLabels.service';
import { ServiceProviderLabelsRepositoryMock } from '../__mock__/serviceProvidersLabels.repository.mock';
import { LabelsService } from '../../../components/labels/labels.service';
import { LabelsCategoriesServiceMock } from '../../../components/labelsCategories/__mocks__/labelsCategories.service.mock';
import { LabelsCategoriesService } from '../../../components/labelsCategories/labelsCategories.service';
import { OrganisationsNoauthRepository } from '../../../components/organisations/organisations.noauth.repository';
import { OrganisationsRepositoryMock } from '../../../components/organisations/__mocks__/organisations.noauth.repository.mock';
import { UsersServiceMock } from '../../../components/bookings/__mocks__/bookings.mocks';
import { MolUsersService } from '../../../components/users/molUsers/molUsers.service';
import { MolUsersServiceMock } from '../../../components/users/molUsers/__mocks__/molUsers.service';
import { UsersService } from '../../../components/users/users.service';
import { TransactionManager, AsyncFunction } from '../../../core/transactionManager';
import { TransactionManagerMock } from '../../../core/__mocks__/transactionManager.mock';
import { OrganisationAdminAuthGroup } from '../../../infrastructure/auth/authGroup';
import { UserContext } from '../../../infrastructure/auth/userContext';
import { UserContextMock } from '../../../infrastructure/auth/__mocks__/userContext';
import { IsolationLevel } from 'typeorm/driver/types/IsolationLevel';
import { ServiceProvidersLabelsActionAuthVisitor } from '../serviceProvidersLabels.auth';
import { SPLabelsCategoriesServiceMock } from '../__mock__/serviceProvidersLabels.service.mock';
import { SPLabelsCategoriesMapper } from '../serviceProvidersLabels.mapper';
import { SPLabelsCategoriesMapperMock } from '../__mock__/serviceProvidersLabels.mapper.mock';
import { ServiceProviderLabelRequest } from '../serviceProvidersLabels.apicontract';

jest.mock('../serviceProvidersLabels.auth');
describe('Service Provider Labels and Categories Services', () => {
	beforeAll(() => {
		jest.resetAllMocks();
		Container.bind(ServiceProviderLabelsRepository).to(ServiceProviderLabelsRepositoryMock);
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	describe('sortSPLabelForDeleteCategory API', () => {
		it(`Should keep labels`, async () => {
			const label1 = ServiceProviderLabel.create('test', 1);
			const { movedLabelsToNoCategory, deleteLabels } = Container.get(
				SPLabelsCategoriesService,
			).sortSPLabelForDeleteCategory([label1], [label1]);
			expect(movedLabelsToNoCategory.length).toBe(1);
			expect(deleteLabels.length).toBe(0);
		});
		it(`Should delete labels`, async () => {
			const label1 = ServiceProviderLabel.create('test', 1);
			const { movedLabelsToNoCategory, deleteLabels } = Container.get(
				SPLabelsCategoriesService,
			).sortSPLabelForDeleteCategory([], [label1]);
			expect(movedLabelsToNoCategory.length).toBe(0);
			expect(deleteLabels.length).toBe(1);
		});
		it(`Should sort label moved and label to delete`, async () => {
			const label1 = ServiceProviderLabel.create('test', 1);
			const label2 = ServiceProviderLabel.create('test', 2);
			const resAllLabel = await Container.get(SPLabelsCategoriesService).sortSPLabelForDeleteCategory(
				[label2],
				[label1, label2],
			);
			expect(resAllLabel.deleteLabels).toStrictEqual([label1]);
			expect(resAllLabel.movedLabelsToNoCategory).toStrictEqual([label2]);
		});
	});

	describe('updateSPLabelToNoCategory API', () => {
		it(`Should merge all labels`, async () => {
			const label1 = ServiceProviderLabel.create('test', 1);
			const label2 = ServiceProviderLabel.create('test', 2);
			(ServiceProviderLabelsRepositoryMock.saveMock as jest.Mock).mockReturnValue([label2]);
			const organisation = Organisation.create('name', 1);
			organisation.labels = [label1];
			const resAllLabel = await Container.get(SPLabelsCategoriesService).updateSPLabelToNoCategory(
				[label2],
				organisation,
			);
			expect(ServiceProviderLabelsRepositoryMock.saveMock).toBeCalledTimes(1);
			expect(resAllLabel).toStrictEqual([label1, label2]);
		});
	});

	describe('updateSPLabel API', () => {
		beforeEach(() => {
			Container.bind(LabelsService).to(LabelsServiceMock);
			Container.bind(LabelsCategoriesService).to(LabelsCategoriesServiceMock);
		});
		it('Should update category', async () => {
			const label1 = ServiceProviderLabel.create('Label1', 1);
			const label2 = ServiceProviderLabel.create('Label2', 2);
			const catego1 = ServiceProviderLabelCategory.create('catego1', [label1], 1);
			const catego2 = ServiceProviderLabelCategory.create('catego2', [label2]);
			const originalCategories = [catego1] as ServiceProviderLabelCategory[];
			const updateCategories = [catego2] as ServiceProviderLabelCategory[];
			const organisation = Organisation.create('org1', 1);
			organisation.labels = [label1];
			organisation.categories = originalCategories;
			(LabelsServiceMock.genericSortLabelForDeleteCategory as jest.Mock).mockReturnValue({
				movedLabelsToNoCategory: [],
				deleteLabels: [],
			});
			(LabelsServiceMock.updateMock as jest.Mock).mockReturnValue([label1]);
			await Container.get(SPLabelsCategoriesService).updateSPLabel(organisation, updateCategories, [label2]);
			expect(LabelsServiceMock.deleteMock).toBeCalledTimes(1);
			expect(LabelsCategoriesServiceMock.deleteMock).toBeCalledTimes(1);
			expect(LabelsCategoriesServiceMock.saveMock).toBeCalledTimes(1);
		});
	});
});

describe('Organisation Service Provider Labels Service', () => {
	const visitorObject = {
		hasPermission: jest.fn(),
	};

	const userMock = User.createAdminUser({
		molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
		userName: 'UserName',
		email: 'test@email.com',
		name: 'Name',
	});

	const organisation = new Organisation();
	organisation.id = 1;
	organisation._organisationAdminGroupMap = {
		organisationRef: 'orga',
		organisationId: 1,
	} as OrganisationAdminGroupMap;
	const labels = [ServiceProviderLabel.create('English', 1)];
	organisation.labels = labels;
	organisation.categories = [ServiceProviderLabelCategory.create('Language', labels, 1)];

	beforeAll(() => {
		jest.resetAllMocks();
		Container.bind(OrganisationsNoauthRepository).to(OrganisationsRepositoryMock);
		Container.bind(MolUsersService).to(MolUsersServiceMock);
		Container.bind(UserContext).to(UserContextMock);
		Container.bind(UsersService).to(UsersServiceMock);
		Container.bind(TransactionManager).to(TransactionManagerMock);
		Container.bind(SPLabelsCategoriesService).to(SPLabelsCategoriesServiceMock);
		Container.bind(SPLabelsCategoriesMapper).to(SPLabelsCategoriesMapperMock);
	});

	beforeEach(() => {
		jest.resetAllMocks();

		visitorObject.hasPermission.mockReturnValue(true);
		(ServiceProvidersLabelsActionAuthVisitor as jest.Mock).mockImplementation(() => visitorObject);
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(userMock));
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new OrganisationAdminAuthGroup(userMock, [organisation])]),
		);
		TransactionManagerMock.runInTransaction.mockImplementation(
			async <T extends unknown>(_isolationLevel: IsolationLevel, asyncFunction: AsyncFunction<T>): Promise<T> =>
				await asyncFunction(),
		);

		SPLabelsCategoriesMapperMock.mapToServiceProviderLabels.mockImplementation(() => [new ServiceProviderLabel()]);
		SPLabelsCategoriesMapperMock.mergeAllLabels.mockImplementation(() => [new ServiceProviderLabel()]);
		SPLabelsCategoriesMapperMock.mapToServiceProviderCategories.mockImplementation(() => [
			new ServiceProviderLabelCategory(),
		]);
		SPLabelsCategoriesServiceMock.updateSPLabel.mockImplementation(() =>
			Promise.resolve([new ServiceProviderLabelCategory()]),
		);
	});
	describe('getOrgServiceProviderLabels API', () => {
		it('should throw error when organisation is undefined', async () => {
			OrganisationsRepositoryMock.getOrganisationById.mockReturnValue(undefined);
			let error;
			try {
				await Container.get(OrganisationSPLabelsService).getOrgServiceProviderLabels(1);
			} catch (e) {
				error = e;
			}
			expect(error.errorCode.httpStatusCode).toBe(404);
			expect(error._message).toBe('Organisation not found');
		});

		it('should return organisation', async () => {
			OrganisationsRepositoryMock.getOrganisationById.mockReturnValue(organisation);
			const result = await Container.get(OrganisationSPLabelsService).getOrgServiceProviderLabels(1);
			expect(result).toBe(organisation);
		});
	});

	describe('updateOrgServiceProviderLabels API', () => {
		it('should throw error when organisation is undefined', async () => {
			OrganisationsRepositoryMock.getOrganisationById.mockReturnValue(undefined);
			let error;
			try {
				await Container.get(OrganisationSPLabelsService).getOrgServiceProviderLabels(1);
			} catch (e) {
				error = e;
			}
			expect(error.errorCode.httpStatusCode).toBe(404);
			expect(error._message).toBe('Organisation not found');
		});

		it('should update successfully and return organisation', async () => {
			OrganisationsRepositoryMock.getOrganisationById.mockReturnValue(organisation);

			OrganisationsRepositoryMock.save.mockImplementation(() => Promise.resolve(organisation));

			const result = await Container.get(OrganisationSPLabelsService).updateOrgServiceProviderLabels(
				1,
				new ServiceProviderLabelRequest(),
			);

			expect(result).toBe(organisation);
		});

		it('should throw error on duplicated labels', async () => {
			OrganisationsRepositoryMock.getOrganisationById.mockReturnValue(organisation);

			OrganisationsRepositoryMock.save.mockRejectedValue({
				message: `duplicate key value violates unique constraint:ServiceProviderLabels`,
			});

			let error;
			try {
				await Container.get(OrganisationSPLabelsService).updateOrgServiceProviderLabels(
					1,
					new ServiceProviderLabelRequest(),
				);
			} catch (e) {
				error = e;
			}

			expect(error._message).toBe('Label(s) are already present');
		});

		it('should throw error on duplicated categories', async () => {
			OrganisationsRepositoryMock.getOrganisationById.mockReturnValue(organisation);

			OrganisationsRepositoryMock.save.mockRejectedValue({
				message: `duplicate key value violates unique constraint:ServiceProviderCategories`,
			});

			let error;
			try {
				await Container.get(OrganisationSPLabelsService).updateOrgServiceProviderLabels(
					1,
					new ServiceProviderLabelRequest(),
				);
			} catch (e) {
				error = e;
			}

			expect(error._message).toBe('Category(ies) are already present');
		});

		it('should throw error on duplicated categories', async () => {
			OrganisationsRepositoryMock.getOrganisationById.mockReturnValue(organisation);

			OrganisationsRepositoryMock.save.mockRejectedValue({
				message: `duplicate key value violates unique constraint`,
			});

			let error;
			try {
				await Container.get(OrganisationSPLabelsService).updateOrgServiceProviderLabels(
					1,
					new ServiceProviderLabelRequest(),
				);
			} catch (e) {
				error = e;
			}

			expect(error._message).toBe('Service Provider name is already present');
		});
	});
});
