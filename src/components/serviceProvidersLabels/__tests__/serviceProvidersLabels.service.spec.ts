import { LabelsServiceMock } from '../../../components/labels/__mocks__/labels.service.mock';
import { Container } from 'typescript-ioc';
import { Organisation, ServiceProviderLabel, ServiceProviderLabelCategory } from '../../../models/entities';
import { ServiceProviderLabelsRepository } from '../serviceProvidersLabels.repository';
import { SPLabelsCategoriesService } from '../serviceProvidersLabels.service';
import { ServiceProviderLabelsRepositoryMock } from '../__mock__/serviceProvidersLabels.repository.mock';
import { LabelsService } from '../../../components/labels/labels.service';
import { LabelsCategoriesServiceMock } from '../../../components/labelsCategories/__mocks__/labelsCategories.service.mock';
import { LabelsCategoriesService } from '../../../components/labelsCategories/labelsCategories.service';

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
