import { ScheduleForm } from '../../../models/entities';
import { ScheduleFormRequest } from '../../scheduleForms/scheduleForms.apicontract';
import { Container } from 'typescript-ioc';
import { ServiceProvidersController } from '../../serviceProviders/serviceProviders.controller';
import { ServiceProvidersService } from '../../serviceProviders/serviceProviders.service';

jest.mock('mol-lib-common', () => {
	const actual = jest.requireActual('mol-lib-common');
	const mock = () => {
		return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => descriptor;
	};
	return {
		...actual,
		MOLAuth: mock,
	};
});

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
	});

	it('should set provider scheduleForm', async () => {
		ServiceProvidersMock.setProvidersScheduleForm.mockReturnValue(Promise.resolve(new ScheduleForm()));
		const providerScheduleFormRequest = new ScheduleFormRequest();
		await Container.get(ServiceProvidersController).setServiceScheduleForm(1, providerScheduleFormRequest);
		expect(ServiceProvidersMock.setProvidersScheduleForm).toBeCalled();
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
