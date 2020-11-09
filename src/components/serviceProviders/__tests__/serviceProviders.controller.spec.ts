import { Container } from 'typescript-ioc';
import { ScheduleForm, ServiceProvider, TimeOfDay, TimeslotItem, TimeslotsSchedule } from '../../../models';
import { ServiceProvidersController } from '../serviceProviders.controller';
import { ServiceProvidersService } from '../serviceProviders.service';
import { ServiceProviderModel, SetProviderScheduleFormRequest } from '../serviceProviders.apicontract';
import { TimeslotItemRequest } from '../../timeslotItems/timeslotItems.apicontract';

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

	beforeAll(() => {
		Container.bind(ServiceProvidersService).to(ServiceProvidersServiceMock);
	});
	const mockItem = new TimeslotItem();
	const request = new TimeslotItemRequest();

	beforeEach(() => {
		mockItem._id = 11;

		mockItem._startTime = TimeOfDay.create({ hours: 8, minutes: 0 });
		mockItem._endTime = TimeOfDay.create({ hours: 9, minutes: 0 });

		request.weekDay = 4;
		request.startTime = '08:00';
		request.endTime = '09:00';
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	it('should get service providers', async () => {
		ServiceProvidersMock.getServiceProviders.mockReturnValue([sp1, sp2]);
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
		ServiceProvidersMock.getServiceProviders.mockReturnValue([sp1]);

		const controller = Container.get(ServiceProvidersController);
		const result = await controller.getServiceProviders(undefined, true);
		expect(result.data.length).toBe(1);
		expect(result.data[0].timeslotsSchedule.timeslots[0].weekDay).toBe(timeslotItem._weekDay);
	});

	it('should get a service provider', async () => {
		ServiceProvidersMock.getServiceProvider.mockReturnValue(ServiceProvider.create('Monica', 1));

		const controller = Container.get(ServiceProvidersController);
		const result = await controller.getServiceProvider(1);

		expect(result.data.name).toEqual('Monica');
	});

	it('should save multiple service providers', async () => {
		ServiceProvidersMock.save.mockReturnValue([
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
		const listRequest = ServiceProvidersMock.save.mock.calls[0][0] as ServiceProvider[];

		expect(listRequest.length).toBe(1);
	});

	it('should save multiple service providers as text', async () => {
		ServiceProvidersMock.save.mockReturnValue([
			ServiceProvider.create('Monica', 1),
			ServiceProvider.create('Timmy', 1),
		]);
		const controller = Container.get(ServiceProvidersController);

		await controller.addServiceProvidersText('name\nJohn\nMary\nJuliet\n', 1);

		const listRequest = ServiceProvidersMock.save.mock.calls[0][0] as ServiceProvider[];

		expect(listRequest.length).toBe(3);
	});

	it('should set provider scheduleForm', async () => {
		ServiceProvidersMock.setProviderScheduleForm.mockReturnValue(Promise.resolve(new ScheduleForm()));
		const providerScheduleFormRequest = new SetProviderScheduleFormRequest();
		providerScheduleFormRequest.scheduleFormId = 2;
		await Container.get(ServiceProvidersController).setServiceScheduleForm(1, providerScheduleFormRequest);
		expect(ServiceProvidersMock.setProviderScheduleForm).toBeCalled();
	});

	it('should update a service provider', async () => {
		ServiceProvidersMock.updateServiceProvider.mockReturnValue(ServiceProvider.create('Test', 1, 'test@gmail.com'));
		const controller = Container.get(ServiceProvidersController);
		const result = await controller.updateServiceProvider(1, {
			name: 'Test',
			email: 'test@gmail.com',
		});
		expect(ServiceProvidersMock.updateServiceProvider).toBeCalled();
		expect(result.data.email).toBe('test@gmail.com');
	});

	it('should get provider scheduleForm', async () => {
		ServiceProvidersMock.getProviderScheduleForm.mockReturnValue(Promise.resolve(new ScheduleForm()));
		await Container.get(ServiceProvidersController).getServiceScheduleForm(1);

		expect(ServiceProvidersMock.getProviderScheduleForm).toBeCalled();
	});

	it('should get provider timeslots scheduleForm', async () => {
		const mockItemId = 11;
		const mockResult = new TimeslotsSchedule();
		mockItem._id = mockItemId;
		mockResult.timeslotItems = [mockItem];
		ServiceProvidersMock.getTimeslotItemsByServiceProviderId.mockReturnValue(mockResult);
		const response = await Container.get(ServiceProvidersController).getTimeslotsScheduleByServiceProviderId(1);
		expect(response.data.timeslots.length).toEqual(1);
		expect(response.data.timeslots[0].id).toEqual(mockItemId);
	});

	it('should set provider schedule timeslots', async () => {
		ServiceProvidersMock.createTimeslotItemForServiceProvider.mockReturnValue(mockItem);

		const response = await Container.get(ServiceProvidersController).createTimeslotItem(1, request);
		expect(response).toBeDefined();
		expect(response.data.startTime).toEqual('08:00');
	});

	it('should update provider schedule timeslots', async () => {
		ServiceProvidersMock.updateTimeslotItemForServiceProvider.mockReturnValue(mockItem);
		const response = await Container.get(ServiceProvidersController).updateTimeslotItem(1, 1, request);
		expect(ServiceProvidersMock.updateTimeslotItemForServiceProvider).toBeCalled();
		expect(response.data.startTime).toEqual('08:00');
	});

	it('should call deleteTimeslotForServiceProvider', async () => {
		ServiceProvidersMock.deleteTimeslotForServiceProvider.mockReturnValue(mockItem);
		await Container.get(ServiceProvidersController).deleteTimeslotItem(1, 1);
		expect(ServiceProvidersMock.deleteTimeslotForServiceProvider).toBeCalled();
	});
});

const ServiceProvidersMock = {
	getServiceProvider: jest.fn(),
	getServiceProviders: jest.fn(),
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
		return ServiceProvidersMock.getServiceProvider();
	}
	public async getServiceProviders(): Promise<ServiceProvider[]> {
		return ServiceProvidersMock.getServiceProviders();
	}
	public async saveServiceProviders(listRequest: ServiceProviderModel[]): Promise<void> {
		return ServiceProvidersMock.save(listRequest);
	}
	public async updateSp(request: ServiceProviderModel, spId: number): Promise<ServiceProvider> {
		return ServiceProvidersMock.updateServiceProvider(request);
	}
	public async setProviderScheduleForm(...params): Promise<ScheduleForm> {
		return ServiceProvidersMock.setProviderScheduleForm(...params);
	}

	public async getProviderScheduleForm(...params): Promise<ScheduleForm> {
		return ServiceProvidersMock.getProviderScheduleForm(...params);
	}

	public async getTimeslotItems(serviceProviderId: number): Promise<TimeslotsSchedule> {
		return ServiceProvidersMock.getTimeslotItemsByServiceProviderId(serviceProviderId);
	}

	public async addTimeslotItem(
		serviceProviderId: number,
		timeslotsSchedule: TimeslotItemRequest,
	): Promise<TimeslotItem> {
		return ServiceProvidersMock.createTimeslotItemForServiceProvider(serviceProviderId, timeslotsSchedule);
	}

	public async updateTimeslotItem(serviceProviderId, timeslotId, request): Promise<TimeslotItem> {
		return ServiceProvidersMock.updateTimeslotItemForServiceProvider(serviceProviderId, timeslotId, request);
	}

	public async deleteTimeslotItem(serviceProviderId: number, timeslotsScheduleId: number): Promise<void> {
		return ServiceProvidersMock.deleteTimeslotForServiceProvider(serviceProviderId, timeslotsScheduleId);
	}
}
