import { OrganisationsRepositoryMock } from '../../../components/organisations/__mocks__/organisations.noauth.repository.mock';
import { Container } from 'typescript-ioc';
import { OrganisationSettingsService } from '../organisations.settings.service';
import { UsersServiceMock } from '../../../components/bookings/__mocks__/bookings.mocks';
import { OrganisationsNoauthRepository } from '../../../components/organisations/organisations.noauth.repository';
import { SPLabelsCategoriesMapper } from '../../../components/serviceProvidersLabels/serviceProvidersLabels.mapper';
import { SPLabelsCategoriesService } from '../../../components/serviceProvidersLabels/serviceProvidersLabels.service';
import { SPLabelsCategoriesMapperMock } from '../../../components/serviceProvidersLabels/__mock__/serviceProvidersLabels.mapper.mock';
import { SPLabelsCategoriesServiceMock } from '../../../components/serviceProvidersLabels/__mock__/serviceProvidersLabels.service.mock';
import { MolUsersService } from '../../../components/users/molUsers/molUsers.service';
import { MolUsersServiceMock } from '../../../components/users/molUsers/__mocks__/molUsers.service';
import { UsersService } from '../../../components/users/users.service';
import { TransactionManager, AsyncFunction } from '../../../core/transactionManager';
import { TransactionManagerMock } from '../../../core/__mocks__/transactionManager.mock';
import { OrganisationAdminAuthGroup } from '../../../infrastructure/auth/authGroup';
import { UserContext } from '../../../infrastructure/auth/userContext';
import { UserContextMock } from '../../../infrastructure/auth/__mocks__/userContext';
import {
	User,
	Organisation,
	OrganisationAdminGroupMap,
	ServiceProviderLabel,
	ServiceProviderLabelCategory,
} from '../../../models';
import { IsolationLevel } from 'typeorm/driver/types/IsolationLevel';
import { OrganisationSettingsRequest } from '../../../components/organisations/organisations.apicontract';
import { ServiceProviderLabelRequest } from '../../../components/serviceProvidersLabels/serviceProvidersLabels.apicontract';
import {OrganisationsActionAuthVisitor, OrganisationsAuthOtherAction} from '../organisations.auth';
import {CrudAction} from "../../../enums/crudAction";

jest.mock('../organisations.auth');

describe('Organisation Settings API', () => {
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

		const orgSettings = new OrganisationSettingsRequest();
		const labelSettings = new ServiceProviderLabelRequest();
		orgSettings.labelSettings = labelSettings;

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
			(OrganisationsActionAuthVisitor as jest.Mock).mockImplementation(() => visitorObject);
			UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(userMock));
			UserContextMock.getAuthGroups.mockImplementation(() =>
				Promise.resolve([new OrganisationAdminAuthGroup(userMock, [organisation])]),
			);
			TransactionManagerMock.runInTransaction.mockImplementation(
				async <T>(_isolationLevel: IsolationLevel, asyncFunction: AsyncFunction<T>): Promise<T> =>
					await asyncFunction(),
			);

			SPLabelsCategoriesMapperMock.mapToServiceProviderLabels.mockImplementation(() => [
				new ServiceProviderLabel(),
			]);
			SPLabelsCategoriesMapperMock.mergeAllLabels.mockImplementation(() => [new ServiceProviderLabel()]);
			SPLabelsCategoriesMapperMock.mapToServiceProviderCategories.mockImplementation(() => [
				new ServiceProviderLabelCategory(),
			]);
			SPLabelsCategoriesServiceMock.updateSPLabel.mockImplementation(() =>
				Promise.resolve([new ServiceProviderLabelCategory()]),
			);
		});

		describe('getOrgSettings API', () => {
			it('should throw error when organisation is undefined', async () => {
				OrganisationsRepositoryMock.getOrganisationById.mockReturnValue(undefined);
				let error;
				try {
					await Container.get(OrganisationSettingsService).getOrgSettings(1);
				} catch (e) {
					error = e;
				}
				expect(error.errorCode.httpStatusCode).toBe(404);
				expect(error._message).toBe('Organisation not found');
			});

			it('should return organisation', async () => {
				OrganisationsRepositoryMock.getOrganisationById.mockReturnValue(organisation);
				const result = await Container.get(OrganisationSettingsService).getOrgSettings(1);
				expect((OrganisationsActionAuthVisitor as jest.Mock).mock.calls[0][1]).toBe(CrudAction.Read);
				expect(result).toBe(organisation);
			});
		});

		describe('getLabels API', () => {
			it('should return organisation', async () => {
				OrganisationsRepositoryMock.getOrganisationById.mockReturnValue(organisation);
				const result = await Container.get(OrganisationSettingsService).getLabels(1);
				expect((OrganisationsActionAuthVisitor as jest.Mock).mock.calls[0][1]).toBe(OrganisationsAuthOtherAction.someRead);
				expect(result).toStrictEqual({categories: organisation.categories, labels: organisation.labels});
			});
		});

		describe('updateOrgSettings API', () => {
			it('should throw error when organisation is undefined', async () => {
				OrganisationsRepositoryMock.getOrganisationById.mockReturnValue(undefined);
				let error;
				try {
					await Container.get(OrganisationSettingsService).getOrgSettings(1);
				} catch (e) {
					error = e;
				}
				expect(error.errorCode.httpStatusCode).toBe(404);
				expect(error._message).toBe('Organisation not found');
			});

			it('should update successfully and return organisation', async () => {
				OrganisationsRepositoryMock.getOrganisationById.mockReturnValue(organisation);

				OrganisationsRepositoryMock.save.mockImplementation(() => Promise.resolve(organisation));

				const result = await Container.get(OrganisationSettingsService).updateOrgSettings(1, orgSettings);

				expect(result).toBe(organisation);
			});

			it('should throw error on duplicated labels', async () => {
				OrganisationsRepositoryMock.getOrganisationById.mockReturnValue(organisation);

				OrganisationsRepositoryMock.save.mockRejectedValue({
					message: `duplicate key value violates unique constraint:ServiceProviderLabels`,
				});

				let error;
				try {
					await Container.get(OrganisationSettingsService).updateOrgSettings(1, orgSettings);
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
					await Container.get(OrganisationSettingsService).updateOrgSettings(1, orgSettings);
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
					await Container.get(OrganisationSettingsService).updateOrgSettings(1, orgSettings);
				} catch (e) {
					error = e;
				}

				expect(error._message).toBe('Service Provider name is already present');
			});
		});
	});
});
