import { Container } from 'typescript-ioc';
import { LabelsCategoriesService } from '../labelsCategories.service';
import { Label, LabelCategory, Organisation, Service, ServiceProviderLabelCategory } from '../../../models';
import { LabelsCategoriesRepository } from '../labelsCategories.repository';
import { LabelsCategoriesRepositoryMock } from '../__mocks__/labelsCategories.repository.mock';
import { LabelsService } from '../../labels/labels.service';
import { LabelsServiceMock } from '../../labels/__mocks__/labels.service.mock';
import { ServiceProviderLabelsCategoriesRepository } from '../../../components/serviceProvidersLabels/serviceProvidersLabels.repository';
import { ServiceProviderLabelsCategoriesRepositoryMock } from '../../../components/serviceProvidersLabels/__mock__/serviceProvidersLabels.repository.mock';
import { LabelResponse } from '../../../components/labels/label.enum';

describe('Test categoriesLabels service', () => {
	beforeAll(() => {
		jest.resetAllMocks();
		Container.bind(LabelsCategoriesRepository).to(LabelsCategoriesRepositoryMock);
		Container.bind(ServiceProviderLabelsCategoriesRepository).to(ServiceProviderLabelsCategoriesRepositoryMock);
		Container.bind(LabelsService).to(LabelsServiceMock);
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	it('Should update category', async () => {
		const label1 = Label.create('Label1', 1);
		const label2 = Label.create('Label2', 2);
		const catego1 = LabelCategory.create('catego1', [label1], 1);
		const catego2 = LabelCategory.create('catego2', [label2]);
		const originalCategories = [catego1] as LabelCategory[];
		const updateCategories = [catego2] as LabelCategory[];
		const service = Service.create('service', {} as Organisation, [label1], originalCategories);
		service.setIsSpAutoAssigned(true);

		(LabelsServiceMock.sortLabelForDeleteCategoryMock as jest.Mock).mockReturnValue({
			movedLabelsToNoCategory: {},
			deleteLabels: {},
		});
		await Container.get(LabelsCategoriesService).update(service, updateCategories, [label2]);

		expect(LabelsServiceMock.updateLabelToNoCategoryMock).toBeCalledTimes(1);
		expect(LabelsServiceMock.deleteMock).toBeCalledTimes(1);
	});

	it('Should add category and delete missing one', async () => {
		const label1 = Label.create('Label1', 1);
		const label2 = Label.create('Label2', 2);
		const catego1 = LabelCategory.create('catego1', [label1], 1);
		const catego2 = LabelCategory.create('catego2', [label2]);
		const originalCategories = [catego1] as LabelCategory[];
		const updateCategories = [catego2] as LabelCategory[];
		const updateListOfCategories = await Container.get(LabelsCategoriesService).sortUpdateCategories(
			originalCategories,
			updateCategories,
			1,
		);

		expect(updateListOfCategories.newCategories).toStrictEqual([catego2]);
		expect(updateListOfCategories.updateOrKeepCategories).toStrictEqual([]);
		expect(updateListOfCategories.deleteCategories).toStrictEqual([catego1]);
	});

	it('Should update category when modify it', async () => {
		const label1 = Label.create('Label1', 1);
		const label2 = Label.create('Label2', 2);
		const catego1 = LabelCategory.create('catego1', [label1], 1);
		const catego2 = LabelCategory.create('catego2', [label2], 1);
		const originalCategories = [catego1] as LabelCategory[];
		const updateCategories = [catego2] as LabelCategory[];
		const updateListOfCategories = await Container.get(LabelsCategoriesService).sortUpdateCategories(
			originalCategories,
			updateCategories,
			1,
		);
		expect(updateListOfCategories.newCategories).toStrictEqual([]);
		expect(updateListOfCategories.updateOrKeepCategories).toStrictEqual([catego2]);
		expect(updateListOfCategories.deleteCategories).toStrictEqual([]);
	});

	describe('delete API', () => {
		const labelCategory = LabelCategory.create('Language');
		const spLabelCategory = ServiceProviderLabelCategory.create('Language');

		it('should delete service label category', async () => {
			await Container.get(LabelsCategoriesService).delete([labelCategory]);
			expect(LabelsCategoriesRepositoryMock.deleteMock).toBeCalledTimes(1);
			expect(ServiceProviderLabelsCategoriesRepositoryMock.deleteMock).not.toBeCalled();
		});

		it('should delete service provider label category', async () => {
			await Container.get(LabelsCategoriesService).delete([spLabelCategory], LabelResponse.SERVICE_PROVIDER);
			expect(ServiceProviderLabelsCategoriesRepositoryMock.deleteMock).toBeCalledTimes(1);
			expect(LabelsCategoriesRepositoryMock.deleteMock).not.toBeCalled();
		});

		it('should not call delete when categories are empty', async () => {
			await Container.get(LabelsCategoriesService).delete([]);
			expect(ServiceProviderLabelsCategoriesRepositoryMock.deleteMock).not.toBeCalled();
			expect(LabelsCategoriesRepositoryMock.deleteMock).not.toBeCalled();
		});
	});
});
