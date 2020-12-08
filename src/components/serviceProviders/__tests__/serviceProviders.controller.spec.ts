import { Container } from 'typescript-ioc';
import { ScheduleForm, ServiceProvider, TimeOfDay, TimeslotItem, TimeslotsSchedule, Service } from '../../../models';
import { ServiceProvidersController } from '../serviceProviders.controller';
import { ServiceProvidersService } from '../serviceProviders.service';
import { ServiceProviderModel } from '../serviceProviders.apicontract';
import { TimeslotItemRequest } from '../../timeslotItems/timeslotItems.apicontract';
import { ScheduleFormRequest } from '../../scheduleForms/scheduleForms.apicontract';
import { ServicesService } from '../../services/services.service';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

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

describe('ServiceProviders.Controller', () => {
	const sp1 = ServiceProvider.create('Monica', 1);
	const sp2 = ServiceProvider.create('Timmy', 1);

	const mockItem = new TimeslotItem();
	const request = new TimeslotItemRequest();

	beforeEach(() => {
		Container.bind(ServiceProvidersService).to(ServiceProvidersServiceMock);
		Container.bind(ServicesService).to(ServicesServiceMock);

		mockItem._id = 11;

		mockItem._startTime = TimeOfDay.create({ hours: 8, minutes: 0 });
		mockItem._endTime = TimeOfDay.create({ hours: 9, minutes: 0 });

		request.weekDay = 4;
		request.startTime = '08:00';
		request.endTime = '09:00';
	});

	beforeEach(() => {
		jest.resetAllMocks();
		jest.clearAllMocks();
	});

	it('should get service providers', async () => {
		ServiceProvidersSvcMock.getServiceProviders.mockReturnValue([sp1, sp2]);
		const controller = Container.get(ServiceProvidersController);
		const result = await controller.getServiceProviders();
		expect(result.data.length).toBe(2);
	});

	it('should get service providers with timeslots', async () => {
		const timeslots = new TimeslotsSchedule();
		const timeslotItem = TimeslotItem.create(
			1,
			0,
			TimeOfDay.create({ hours: 8, minutes: 0 }),
			TimeOfDay.create({ hours: 9, minutes: 0 }),
		);
		timeslots.timeslotItems = [timeslotItem];
		sp1.timeslotsSchedule = timeslots;
		ServiceProvidersSvcMock.getServiceProviders.mockReturnValue([sp1]);

		const controller = Container.get(ServiceProvidersController);
		const result = await controller.getServiceProviders(undefined, true);
		expect(result.data.length).toBe(1);
		expect(result.data[0].timeslotsSchedule.timeslots[0].weekDay).toBe(timeslotItem._weekDay);
	});

	it('should get a service provider', async () => {
		ServiceProvidersSvcMock.getServiceProvider.mockReturnValue(ServiceProvider.create('Monica', 1));

		const controller = Container.get(ServiceProvidersController);
		const result = await controller.getServiceProvider(1);

		expect(result.data.name).toEqual('Monica');
	});

	it('should get provider scheduleForm', async () => {
		ServiceProvidersSvcMock.getProviderScheduleForm.mockReturnValue(Promise.resolve(new ScheduleForm()));
		await Container.get(ServiceProvidersController).getServiceScheduleForm(1);

		expect(ServiceProvidersSvcMock.getProviderScheduleForm).toBeCalled();
	});

	it('should get provider timeslots scheduleForm', async () => {
		const mockItemId = 11;
		const mockResult = new TimeslotsSchedule();
		mockItem._id = mockItemId;
		mockResult.timeslotItems = [mockItem];
		ServiceProvidersSvcMock.getTimeslotItemsByServiceProviderId.mockReturnValue(mockResult);
		const response = await Container.get(ServiceProvidersController).getTimeslotsScheduleByServiceProviderId(1);
		expect(response.data.timeslots.length).toEqual(1);
		expect(response.data.timeslots[0].id).toEqual(mockItemId);
	});

	it('should get available SP from a service', async () => {

		const startDate = new Date(2020, 12, 6, 7, 0);
		const endDate = new Date(2020, 12, 6, 10, 0);
		const timeslots = new TimeslotsSchedule();
		const timeslotItem = TimeslotItem.create(
			1,
			0,
			TimeOfDay.create({ hours: 8, minutes: 0 }),
			TimeOfDay.create({ hours: 9, minutes: 0 }),
		);
		timeslots.timeslotItems = [timeslotItem];
		sp1.timeslotsSchedule = timeslots;
		ServiceProvidersSvcMock.getAvailableServiceProviders.mockReturnValue([sp1]);
		const result = await Container.get(ServiceProvidersController).getAvailableServiceProviders(startDate, endDate, 1);

		expect(result.data.length).toBe(1);
		expect(result.data[0].serviceId).toBe(1);
	});

	it('should get available SP from multiple services', async () => {

		const svc1 = new Service();
		svc1.id = 1;
		const svc2 = new Service();
		svc2.id = 2;
		const sp3 = ServiceProvider.create('Jack', svc2.id);

		const startDate = new Date(2020, 12, 6, 7, 0);
		const endDate = new Date(2020, 12, 6, 10, 0);
		const timeslots = new TimeslotsSchedule();
		const timeslotItem = TimeslotItem.create(
			1,
			0,
			TimeOfDay.create({ hours: 8, minutes: 0 }),
			TimeOfDay.create({ hours: 9, minutes: 0 }),
		);
		timeslots.timeslotItems = [timeslotItem];
		sp1.timeslotsSchedule = timeslots;
		sp3.timeslotsSchedule = timeslots;



		ServicesServiceMock.getServices.mockReturnValue([svc1, svc2]);
		ServiceProvidersSvcMock.getAvailableServiceProviders
			.mockImplementationOnce(() => [sp1])
			.mockImplementationOnce(() => [sp3]);
		const result = await Container.get(ServiceProvidersController).getAvailableServiceProviders(startDate, endDate);

		expect(result.data.length).toBe(2);
		expect(result.data[0].serviceId).toBe(1);
		expect(result.data[1].serviceId).toBe(2);

	});

	it('should save multiple service providers', async () => {
		ServiceProvidersSvcMock.save.mockReturnValue([
			ServiceProvider.create('Monica', 1),
			ServiceProvider.create('Timmy', 1),
		]);
		const controller = Container.get(ServiceProvidersController);
		await controller.addServiceProviders(
			{
				serviceProviders: [
					{
						name: 'Test',
					},
				],
			},
			1,
		);
		const listRequest = ServiceProvidersSvcMock.save.mock.calls[0][0] as ServiceProvider[];

		expect(listRequest.length).toBe(1);
	});

	it('should save multiple service providers as text', async () => {
		ServiceProvidersSvcMock.save.mockReturnValue([
			ServiceProvider.create('Monica', 1),
			ServiceProvider.create('Timmy', 1),
		]);
		const controller = Container.get(ServiceProvidersController);

		await controller.addServiceProvidersText('name\nJohn\nMary\nJuliet\n', 1);

		const listRequest = ServiceProvidersSvcMock.save.mock.calls[0][0] as ServiceProvider[];

		expect(listRequest.length).toBe(3);
	});

	it('should set provider scheduleForm', async () => {
		ServiceProvidersSvcMock.setProviderScheduleForm.mockReturnValue(Promise.resolve(new ScheduleForm()));
		const providerScheduleFormRequest = new ScheduleFormRequest();
		await Container.get(ServiceProvidersController).setServiceScheduleForm(1, providerScheduleFormRequest);
		expect(ServiceProvidersSvcMock.setProviderScheduleForm).toBeCalled();
	});

	it('should update a service provider', async () => {
		ServiceProvidersSvcMock.updateServiceProvider.mockReturnValue(ServiceProvider.create('Test', 1, 'test@gmail.com'));
		const controller = Container.get(ServiceProvidersController);
		const result = await controller.updateServiceProvider(1, {
			name: 'Test',
			email: 'test@gmail.com',
		});
		expect(ServiceProvidersSvcMock.updateServiceProvider).toBeCalled();
		expect(result.data.email).toBe('test@gmail.com');
	});




	it('should set provider schedule timeslots', async () => {
		ServiceProvidersSvcMock.createTimeslotItemForServiceProvider.mockReturnValue(mockItem);

		const response = await Container.get(ServiceProvidersController).createTimeslotItem(1, request);
		expect(response).toBeDefined();
		expect(response.data.startTime).toEqual('08:00');
	});

	it('should update provider schedule timeslots', async () => {
		ServiceProvidersSvcMock.updateTimeslotItemForServiceProvider.mockReturnValue(mockItem);
		const response = await Container.get(ServiceProvidersController).updateTimeslotItem(1, 1, request);
		expect(ServiceProvidersSvcMock.updateTimeslotItemForServiceProvider).toBeCalled();
		expect(response.data.startTime).toEqual('08:00');
	});

	it('should call deleteTimeslotForServiceProvider', async () => {
		ServiceProvidersSvcMock.deleteTimeslotForServiceProvider.mockReturnValue(mockItem);
		await Container.get(ServiceProvidersController).deleteTimeslotItem(1, 1);
		expect(ServiceProvidersSvcMock.deleteTimeslotForServiceProvider).toBeCalled();
	});
});

const ServiceProvidersSvcMock = {
	getServiceProvider: jest.fn(),
	getServiceProviders: jest.fn(),
	getAvailableServiceProviders: jest.fn(),
	updateServiceProvider: jest.fn(),
	save: jest.fn(),
	setProviderScheduleForm: jest.fn(),
	getProviderScheduleForm: jest.fn(),
	getTimeslotItemsByServiceProviderId: jest.fn(),
	createTimeslotItemForServiceProvider: jest.fn(),
	updateTimeslotItemForServiceProvider: jest.fn(),
	deleteTimeslotForServiceProvider: jest.fn(),
};

class ServiceProvidersServiceMock extends ServiceProvidersService {
	public async getServiceProvider(spId: number): Promise<ServiceProvider> {
		return ServiceProvidersSvcMock.getServiceProvider();
	}
	public async getServiceProviders(): Promise<ServiceProvider[]> {
		return ServiceProvidersSvcMock.getServiceProviders();
	}
	public async getAvailableServiceProviders(): Promise<ServiceProvider[]> {
		return ServiceProvidersSvcMock.getAvailableServiceProviders();
	}

	public async saveServiceProviders(listRequest: ServiceProviderModel[]): Promise<void> {
		return ServiceProvidersSvcMock.save(listRequest);
	}
	public async updateSp(request: ServiceProviderModel, spId: number): Promise<ServiceProvider> {
		return ServiceProvidersSvcMock.updateServiceProvider(request);
	}
	public async setProviderScheduleForm(...params): Promise<ScheduleForm> {
		return ServiceProvidersSvcMock.setProviderScheduleForm(...params);
	}

	public async getProviderScheduleForm(...params): Promise<ScheduleForm> {
		return ServiceProvidersSvcMock.getProviderScheduleForm(...params);
	}

	public async getTimeslotItems(serviceProviderId: number): Promise<TimeslotsSchedule> {
		return ServiceProvidersSvcMock.getTimeslotItemsByServiceProviderId(serviceProviderId);
	}

	public async addTimeslotItem(
		serviceProviderId: number,
		timeslotsSchedule: TimeslotItemRequest,
	): Promise<TimeslotItem> {
		return ServiceProvidersSvcMock.createTimeslotItemForServiceProvider(serviceProviderId, timeslotsSchedule);
	}

	public async updateTimeslotItem(serviceProviderId, timeslotId, request): Promise<TimeslotItem> {
		return ServiceProvidersSvcMock.updateTimeslotItemForServiceProvider(serviceProviderId, timeslotId, request);
	}

	public async deleteTimeslotItem(serviceProviderId: number, timeslotsScheduleId: number): Promise<void> {
		return ServiceProvidersSvcMock.deleteTimeslotForServiceProvider(serviceProviderId, timeslotsScheduleId);
	}
}


class ServicesServiceMock extends ServicesService {
	public static getServices = jest.fn();

	public async getServices(): Promise<Service[]> {
		return ServicesServiceMock.getServices();
	}

}
