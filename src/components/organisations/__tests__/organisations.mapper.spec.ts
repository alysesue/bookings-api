import { SPLabelsCategoriesMapper } from '../../../components/serviceProvidersLabels/serviceProvidersLabels.mapper';
import { SPLabelsCategoriesMapperMock } from '../../../components/serviceProvidersLabels/__mock__/serviceProvidersLabels.mapper.mock';
import { Container } from 'typescript-ioc';
import {
	ServiceProviderLabelCategoryResponseModel,
	ServiceProviderLabelResponse,
	ServiceProviderLabelResponseModel,
} from '../../../components/serviceProvidersLabels/serviceProvidersLabels.apicontract';
import { OrganisationsMapper } from '../organisations.mapper';
import {Organisation, ServiceProviderLabel, ServiceProviderLabelCategory} from '../../../models';
import { OrganisationSettingsResponse } from '../organisations.apicontract';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

describe('Organisations mapper', () => {
	beforeEach(() => {
		Container.bind(SPLabelsCategoriesMapper).to(SPLabelsCategoriesMapperMock);
	});

	it('return organisation settings response', () => {
		const labels = new ServiceProviderLabelResponseModel('English', 'hashLabelId', 'orgId');
		const categories = new ServiceProviderLabelCategoryResponseModel(
			'Language',
			[labels],
			'hashCategoryId',
			'orgId',
		);
		const organisationSettings = new OrganisationSettingsResponse();
		const labelSettings = new ServiceProviderLabelResponse();
		labelSettings.labels = [labels];
		labelSettings.categories = [categories];
		organisationSettings.labelSettings = labelSettings;

		SPLabelsCategoriesMapperMock.mapToServiceProviderLabelsResponse.mockReturnValue([labels]);
		SPLabelsCategoriesMapperMock.mapToCategoriesResponse.mockReturnValue([categories]);

		const result = Container.get(OrganisationsMapper).mapToOrganisationSettings(new Organisation());
		expect(result).toEqual(organisationSettings);
	});

	it('return organisation settings response', () => {
		const label = ServiceProviderLabel.create('label', 1);
		const result = Container.get(OrganisationsMapper).mapToOrganisationLabels([label], [ServiceProviderLabelCategory.create('name', [label], 1)]);
		expect(result).toEqual({
			"categories": [
				{
					"categoryName": "Language",
					"id": "hashCategoryId",
					"labels": [
						{
							"id": "hashLabelId",
							"name": "English",
							"organisationId": "orgId"
						}
					],
					"organisationId": "orgId"
				}
			],
			"labels": [
				{
					"id": "hashLabelId",
					"name": "English",
					"organisationId": "orgId"
				}
			]
		});
	});
})