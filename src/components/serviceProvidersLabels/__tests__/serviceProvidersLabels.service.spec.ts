import { LabelsServiceMock } from '../../../components/labels/__mocks__/labels.service.mock';
import { Container } from 'typescript-ioc';
import { Organisation, ServiceProviderLabel, ServiceProviderLabelCategory } from '../../../models/entities';
import {
	ServiceProviderLabelsCategoriesRepository,
	ServiceProviderLabelsRepository,
} from '../serviceProvidersLabels.repository';
import { SPLabelsCategoriesService } from '../serviceProvidersLabels.service';
import {
	ServiceProviderLabelsCategoriesRepositoryMock,
	ServiceProviderLabelsRepositoryMock,
} from '../__mock__/serviceProvidersLabels.repository.mock';
import { LabelsService } from '../../../components/labels/labels.service';
import { LabelsCategoriesServiceMock } from '../../../components/labelsCategories/__mocks__/labelsCategories.service.mock';
import { LabelsCategoriesService } from '../../../components/labelsCategories/labelsCategories.service';
import { IdHasher } from '../../../infrastructure/idHasher';
import { IdHasherMock } from '../../../infrastructure/__mocks__/idHasher.mock';

describe('Service Provider Labels and Categories Services', () => {
	beforeAll(() => {
		jest.resetAllMocks();
		Container.bind(ServiceProviderLabelsRepository).to(ServiceProviderLabelsRepositoryMock);
		Container.bind(ServiceProviderLabelsCategoriesRepository).to(ServiceProviderLabelsCategoriesRepositoryMock);
		Container.bind(IdHasher).to(IdHasherMock);
	});

	beforeEach(() => {
		jest.resetAllMocks();
		IdHasherMock.encode.mockImplementation((value: number) => value.toString());
		IdHasherMock.decode.mockImplementation((value: string) => Number.parseInt(value, 10));
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

			(ServiceProviderLabelsRepositoryMock.saveMock as jest.Mock).mockReturnValue([label1]);
			(ServiceProviderLabelsCategoriesRepositoryMock.deleteMock as jest.Mock).mockReturnValue({});
			(ServiceProviderLabelsCategoriesRepositoryMock.saveMock as jest.Mock).mockReturnValue({});

			await Container.get(SPLabelsCategoriesService).updateSPLabel(organisation, updateCategories, [label2]);
			expect(ServiceProviderLabelsRepositoryMock.saveMock).toBeCalledTimes(1);
			expect(ServiceProviderLabelsCategoriesRepositoryMock.deleteMock).toBeCalledTimes(1);
			expect(ServiceProviderLabelsCategoriesRepositoryMock.saveMock).toBeCalledTimes(1);
		});
	});

	describe('verifySPLabels', () => {
		const label1 = ServiceProviderLabel.create('Label1', 1);
		const catego1 = ServiceProviderLabelCategory.create('catego1', [label1], 1);
		const organisation = Organisation.create('org1', 1);
		const originalCategories = [catego1] as ServiceProviderLabelCategory[];
		organisation.labels = [label1];
		organisation.categories = originalCategories;

		it('Should skip if array is empty', async () => {
			ServiceProviderLabelsRepositoryMock.findMock.mockReturnValue([]);
			const resLabel = await Container.get(SPLabelsCategoriesService).verifySPLabels([], organisation);

			expect(resLabel).toStrictEqual([]);
		});

		it('Should throw if labels undefined', async () => {
			ServiceProviderLabelsRepositoryMock.findMock.mockReturnValue([]);
			const resLabel = Container.get(SPLabelsCategoriesService).verifySPLabels(['1'], new Organisation());

			await expect(resLabel).rejects.toThrowError('required');
		});

		it('Should verify if labels are present in Service & remove duplication', async () => {
			const labelIds = ['1', '1', '2'];

			const org = new Organisation();
			org.labels = [ServiceProviderLabel.create('ABC1', 1), ServiceProviderLabel.create('ABC2', 2)];
			org.categories = [];
			const resLabel = await Container.get(SPLabelsCategoriesService).verifySPLabels(labelIds, org);

			expect(resLabel).toStrictEqual([
				ServiceProviderLabel.create('ABC1', 1),
				ServiceProviderLabel.create('ABC2', 2),
			]);
		});

		it(`Should throw if label id doesn't exist`, async () => {
			const labelIds = ['1', '1', '2'];

			const asyncTest = Container.get(SPLabelsCategoriesService).verifySPLabels(labelIds, organisation);
			await expect(asyncTest).rejects.toThrowErrorMatchingInlineSnapshot(`"Invalid label id: 2"`);
		});
	});
});
