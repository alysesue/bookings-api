import { Organisation, ScheduleForm } from '../../../models/entities';
import { ScheduleFormRequest } from '../../scheduleForms/scheduleForms.apicontract';
import { Container } from 'typescript-ioc';
import { ServiceProvidersController } from '../../serviceProviders/serviceProviders.controller';
import { ServiceProvidersService } from '../../serviceProviders/serviceProviders.service';
import { IdHasher } from '../../../infrastructure/idHasher';
import { IdHasherMock } from '../../../infrastructure/__mocks__/idHasher.mock';
import { OrganisationsMapper } from '../organisations.mapper';
import { OrganisationsMapperMock } from '../__mocks__/organisations.mapper.mock';
import { OrganisationSettingsRequest, OrganisationSettingsResponse } from '../organisations.apicontract';
import { OrganisationsControllerV2 } from '../organisations.controller';
import { OrganisationSettingsServiceMock } from '../__mocks__/organisations.settings.service.mock';
import { OrganisationSettingsService } from '../organisations.settings.service';

describe('Organisations.controller', () => {
	beforeAll(() => {
		Container.bind(ServiceProvidersService).to(ServiceProvidersServiceMock);
	});
	afterAll(() => {
		jest.resetAllMocks();
		if (global.gc) global.gc();
	});
	beforeEach(() => {
		jest.resetAllMocks();
		Container.bind(IdHasher).to(IdHasherMock);
		Container.bind(OrganisationSettingsService).to(OrganisationSettingsServiceMock);
		Container.bind(OrganisationsMapper).to(OrganisationsMapperMock);

		IdHasherMock.decode.mockImplementation(() => 1);
	});

	it('should set provider scheduleForm', async () => {
		ServiceProvidersMock.setProvidersScheduleForm.mockReturnValue(Promise.resolve(new ScheduleForm()));
		const providerScheduleFormRequest = new ScheduleFormRequest();
		await Container.get(ServiceProvidersController).setServiceScheduleForm(1, providerScheduleFormRequest);
		expect(ServiceProvidersMock.setProvidersScheduleForm).toBeCalled();
	});

	it('should get organisation settings', async () => {
		OrganisationSettingsServiceMock.getOrgSettings.mockReturnValue(Promise.resolve(Organisation.create('org1', 1)));
		OrganisationsMapperMock.mapToOrganisationSettings.mockImplementation(() => new OrganisationSettingsResponse());

		const response = await Container.get(OrganisationsControllerV2).getOrganisationSettings('hashId');
		expect(IdHasherMock.decode).toBeCalledTimes(1);
		expect(OrganisationSettingsServiceMock.getOrgSettings).toBeCalledTimes(1);
		expect(OrganisationsMapperMock.mapToOrganisationSettings).toBeCalledTimes(1);
		expect(response).toBeDefined();
	});

	it('should update organisation settings', async () => {
		OrganisationSettingsServiceMock.updateOrgSettings.mockReturnValue(
			Promise.resolve(Organisation.create('org1', 1)),
		);
		OrganisationsMapperMock.mapToOrganisationSettings.mockImplementation(() => new OrganisationSettingsResponse());

		const response = await Container.get(OrganisationsControllerV2).setOrganisationSettings(
			'hashId',
			new OrganisationSettingsRequest(),
		);

		expect(IdHasherMock.decode).toBeCalledTimes(1);
		expect(OrganisationSettingsServiceMock.updateOrgSettings).toBeCalledTimes(1);
		expect(OrganisationsMapperMock.mapToOrganisationSettings).toBeCalledTimes(1);
		expect(response).toBeDefined();
	});
});

const ServiceProvidersMock = {
	setProvidersScheduleForm: jest.fn(),
};

class ServiceProvidersServiceMock implements Partial<ServiceProvidersService> {
	public async setProviderScheduleForm(...param): Promise<ScheduleForm> {
		return ServiceProvidersMock.setProvidersScheduleForm(...param);
	}
}
