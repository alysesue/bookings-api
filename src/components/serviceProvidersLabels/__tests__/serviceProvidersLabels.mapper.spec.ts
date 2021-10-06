import { Container } from 'typescript-ioc';
import { IdHasher } from '../../../infrastructure/idHasher';
import { IdHasherMock } from '../../../infrastructure/__mocks__/idHasher.mock';
import { ServiceProviderLabel, ServiceProviderLabelCategory } from '../../../models';
import { SPLabelsCategoriesMapper } from '../serviceProvidersLabels.mapper';
import {
	ServiceProviderLabelCategoryRequestModel,
	ServiceProviderLabelRequestModel,
} from '../serviceProvidersLabels.apicontract';

describe('Test categoriesLabels mapper', () => {
	beforeAll(() => {
		jest.resetAllMocks();
	});

	beforeEach(() => {
		jest.resetAllMocks();
		Container.bind(IdHasher).to(IdHasherMock);

		IdHasherMock.encode.mockImplementation(() => {});
		IdHasherMock.decode.mockImplementation(() => 1);
	});

	describe('mapToServiceProviderLabelsResponse API', () => {
		it('return response model', () => {
			const data = ServiceProviderLabel.create('English', 1);
			IdHasherMock.encode.mockReturnValue('hashId');
			const response = Container.get(SPLabelsCategoriesMapper).mapToServiceProviderLabelsResponse([data]);

			expect(response[0].name).toBe('English');
			expect(response[0].id).toBe('hashId');
		});

		it('return empty array if no data is passed', () => {
			const response = Container.get(SPLabelsCategoriesMapper).mapToServiceProviderLabelsResponse();

			expect(response).toHaveLength(0);
		});
	});

	describe('mapToServiceProviderLabels API', () => {
		it('return empty array if no data is passed', () => {
			const response = Container.get(SPLabelsCategoriesMapper).mapToServiceProviderLabels();

			expect(response).toHaveLength(0);
		});
		it('return service provider labels', () => {
			const labels = new ServiceProviderLabelRequestModel('English', 'hashId');

			const response = Container.get(SPLabelsCategoriesMapper).mapToServiceProviderLabels([labels]);

			expect(response[0].labelText).toBe('English');
			expect(response[0].id).toBe(1);
		});

		it('return service provider labels without duplicate (1 without label id)', () => {
			const labels = new ServiceProviderLabelRequestModel('English', 'hashId');
			const labelWithoutId = new ServiceProviderLabelRequestModel('English');
			const response = Container.get(SPLabelsCategoriesMapper).mapToServiceProviderLabels([
				labels,
				labelWithoutId,
			]);
			expect(response.length).toBe(1);
		});

		it('return service provider labels without duplicate (both without label id)', () => {
			const labelWithoutId1 = new ServiceProviderLabelRequestModel('English');
			const labelWithoutId2 = new ServiceProviderLabelRequestModel('English');
			const response = Container.get(SPLabelsCategoriesMapper).mapToServiceProviderLabels([
				labelWithoutId1,
				labelWithoutId2,
			]);
			expect(response.length).toBe(1);
		});
	});

	describe('mergeAllLabels API', () => {
		it('return service provider labels', () => {
			const response = Container.get(SPLabelsCategoriesMapper).mergeAllLabels(
				[ServiceProviderLabel.create('English', 1)],
				[ServiceProviderLabel.create('English', 1), ServiceProviderLabel.create('Malay', 2)],
			);

			expect(response[0].labelText).toBe('English');
			expect(response[0].id).toBe(1);
		});

		it('return service provider labels without one label from original list', () => {
			const response = Container.get(SPLabelsCategoriesMapper).mergeAllLabels(
				[ServiceProviderLabel.create('English', 1), ServiceProviderLabel.create('Malay', 2)],
				[ServiceProviderLabel.create('Malay', 2)],
			);

			expect(response[0].labelText).toBe('Malay');
			expect(response[0].id).toBe(2);
		});
	});

	describe('mapToCategoriesResponse API', () => {
		const label1 = ServiceProviderLabel.create('English', 1);
		const label2 = ServiceProviderLabel.create('Singapore', 1);
		const cat1 = ServiceProviderLabelCategory.create('Language', [label1], 1);
		const cat2 = ServiceProviderLabelCategory.create('Country', [label2], 1);

		it('return empty array if no data is passed', () => {
			const result = Container.get(SPLabelsCategoriesMapper).mapToCategoriesResponse();
			expect(result).toHaveLength(0);
		});

		it('should return correct response', () => {
			const result = Container.get(SPLabelsCategoriesMapper).mapToCategoriesResponse([cat1]);
			expect(result[0].categoryName).toBe(cat1.name);
			expect(result[0].labels[0].name).toBe(label1.labelText);
		});

		it('should return LabelCategory with length 2', () => {
			const result = Container.get(SPLabelsCategoriesMapper).mapToCategoriesResponse([cat1, cat2]);
			expect(result).toHaveLength(2);
		});
	});

	describe('mapToServiceProviderCategories API', () => {
		const labelsRequest = new ServiceProviderLabelRequestModel('English', 'hashId');
		const request = new ServiceProviderLabelCategoryRequestModel('Language', [labelsRequest], 'hashId');

		it('return empty array if no data is passed', () => {
			const result = Container.get(SPLabelsCategoriesMapper).mapToServiceProviderCategories();
			expect(result).toHaveLength(0);
		});

		it('(hashId is provided) should return mapped category', () => {
			const label = ServiceProviderLabel.create('English', 1);

			const result = Container.get(SPLabelsCategoriesMapper).mapToServiceProviderCategories([request]);

			expect(result[0].id).toBe(1);
			expect(result[0].name).toEqual(request.categoryName);
			expect(result[0].labels[0].id).toEqual(label.id);
			expect(result[0].labels[0].labelText).toEqual(label.labelText);
		});

		it('(hashId is not provided) should return mapped category', () => {
			const label = ServiceProviderLabel.create('English', 1);
			request.id = undefined;

			const result = Container.get(SPLabelsCategoriesMapper).mapToServiceProviderCategories([request]);

			expect(result[0].id).toBe(undefined);
			expect(result[0].name).toEqual(request.categoryName);
			expect(result[0].labels[0].id).toEqual(label.id);
			expect(result[0].labels[0].labelText).toEqual(label.labelText);
		});
	});
});
