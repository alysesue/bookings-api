import { LabelsMapper } from '../../../components/labels/labels.mapper';
import { LabelsMapperMock } from '../../../components/labels/__mocks__/labels.mapper.mock';
import { Container } from 'typescript-ioc';
import { Label, LabelCategory } from '../../../models';
import { LabelRequestModel, LabelResponseModel } from '../../../components/labels/label.apicontract';
import { LabelsCategoriesMapper } from '../labelsCategories.mapper';
import { IdHasher } from '../../../infrastructure/idHasher';
import { IdHasherMock } from '../../../infrastructure/__mocks__/idHasher.mock';
import { LabelCategoryRequestModel } from '../labelsCategories.apicontract';

describe('Test categoriesLabels mapper', () => {
	beforeAll(() => {
		jest.resetAllMocks();
	});

	beforeEach(() => {
		jest.resetAllMocks();
		Container.bind(IdHasher).to(IdHasherMock);
		Container.bind(LabelsMapper).to(LabelsMapperMock);

		IdHasherMock.encode.mockImplementation(() => {});
		IdHasherMock.decode.mockImplementation(() => {});
	});

	describe('mapToCategoriesResponse API', () => {
		const label1 = Label.create('English', 1);
		const label2 = Label.create('Singapore', 1);
		const cat1 = LabelCategory.create('Language', [label1], 1);
		const cat2 = LabelCategory.create('Country', [label2], 1);

		const labelResponse = new LabelResponseModel('hashId', 'English', 1);

		it('should return correct response', () => {
			LabelsMapperMock.mapToLabelsResponse.mockReturnValue([labelResponse]);
			const result = Container.get(LabelsCategoriesMapper).mapToCategoriesResponse([cat1]);
			expect(result[0].categoryName).toBe(cat1.name);
			expect(result[0].labels[0].label).toBe(label1.labelText);
		});

		it('should return LabelCategory with length 2', () => {
			LabelsMapperMock.mapToLabelsResponse.mockReturnValue([labelResponse]);
			const result = Container.get(LabelsCategoriesMapper).mapToCategoriesResponse([cat1, cat2]);
			expect(result).toHaveLength(2);
		});
	});

	describe('mapToCategories API', () => {
		const labelsRequest = new LabelRequestModel('English', 'hashId');
		const request = new LabelCategoryRequestModel('Language', [labelsRequest], 'hashId');

		it('(hashId is provided) should return mapped category', () => {
			const label = Label.create('English', 1);
			IdHasherMock.decode.mockReturnValue(1);
			LabelsMapperMock.mapToLabels.mockReturnValue([label]);

			const result = Container.get(LabelsCategoriesMapper).mapToCategories([request]);

			expect(result[0].id).toBe(1);
			expect(result[0].name).toEqual(request.categoryName);
			expect(result[0].labels[0].id).toEqual(label.id);
			expect(result[0].labels[0].labelText).toEqual(label.labelText);
		});

		it('(hashId is not provided) should return mapped category', () => {
			const label = Label.create('English', 1);
			request.id = undefined;
			LabelsMapperMock.mapToLabels.mockReturnValue([label]);

			const result = Container.get(LabelsCategoriesMapper).mapToCategories([request]);

			expect(result[0].id).toBe(undefined);
			expect(result[0].name).toEqual(request.categoryName);
			expect(result[0].labels[0].id).toEqual(label.id);
			expect(result[0].labels[0].labelText).toEqual(label.labelText);
		});
	});
});
