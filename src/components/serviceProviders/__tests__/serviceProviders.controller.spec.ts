import { Container } from 'typescript-ioc';
import {
	Booking,
	ScheduleForm,
	Service,
	ServiceProvider,
	ServiceProviderLabel,
	TimeOfDay,
	TimeslotItem,
	TimeslotsSchedule,
	User,
} from '../../../models';
import { ServiceProvidersController, ServiceProvidersControllerV2 } from '../serviceProviders.controller';
import { ServiceProvidersService } from '../serviceProviders.service';
import { TimeslotItemRequest } from '../../timeslotItems/timeslotItems.apicontract';
import { ScheduleFormRequest } from '../../scheduleForms/scheduleForms.apicontract';
import { ServicesService } from '../../services/services.service';
import { ServiceProvidersServiceMock } from '../__mocks__/serviceProviders.service.mock';
import { UserContextMock } from '../../../infrastructure/auth/__mocks__/userContext';
import { UserContext } from '../../../infrastructure/auth/userContext';
import { IdHasher } from '../../../infrastructure/idHasher';
import { IdHasherMock } from '../../../infrastructure/__mocks__/idHasher.mock';
import { IPagedEntities } from '../../../core/pagedEntities';

jest.mock('../../services/services.service', () => {
	class ServicesService {}
	return { ServicesService };
});

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

beforeAll(() => {
	Container.bind(ServiceProvidersService).to(ServiceProvidersServiceMock);
	Container.bind(ServicesService).to(ServicesServiceMock);
	Container.bind(UserContext).to(UserContextMock);
	Container.bind(IdHasher).to(IdHasherMock);
});

// tslint:disable-next-line:no-big-function
describe('ServiceProviders.Controller.V1', () => {
	const sp1 = ServiceProvider.create('Monica', 1);
	const sp2 = ServiceProvider.create('Timmy', 1);

	const mockItem = new TimeslotItem();
	const request = new TimeslotItemRequest();
	const adminMock = User.createAdminUser({
		molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
		userName: 'UserName',
		email: 'test@email.com',
		name: 'Name',
	});

	beforeEach(() => {
		jest.resetAllMocks();
		jest.clearAllMocks();

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));

		mockItem._id = 11;
		mockItem._startTime = TimeOfDay.create({ hours: 8, minutes: 0 });
		mockItem._endTime = TimeOfDay.create({ hours: 9, minutes: 0 });

		request.weekDay = 4;
		request.startTime = '08:00';
		request.endTime = '09:00';
	});

	it('should get service providers', async () => {
		ServiceProvidersServiceMock.getServiceProvidersMock.mockImplementation(() =>
			Promise.resolve({
				entries: [sp1, sp2],
			} as unknown as IPagedEntities<Booking>),
		);
		ServiceProvidersServiceMock.getPagedServiceProvidersMock.mockImplementation(() =>
			Promise.resolve({
				entries: [sp1, sp2],
			} as unknown as IPagedEntities<Booking>),
		);
		const controller = Container.get(ServiceProvidersController);
		const result = await controller.getServiceProviders();
		expect(result.data.length).toBe(2);
	});

	it('should get total service providers', async () => {
		const controller = Container.get(ServiceProvidersController);
		await controller.getTotalServiceProviders();
		expect(ServiceProvidersServiceMock.getServiceProvidersCountMock).toHaveBeenCalled();
	});

	it('should search SP by name', async () => {
		ServiceProvidersServiceMock.getServiceProvidersByNameMock.mockReturnValue([sp1]);
		const controller = Container.get(ServiceProvidersController);
		await controller.getServiceProvidersByName('mon', 1);
		expect(ServiceProvidersServiceMock.getServiceProvidersByNameMock).toHaveBeenCalled();
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
		ServiceProvidersServiceMock.getPagedServiceProvidersMock.mockImplementation(() =>
			Promise.resolve({
				entries: [sp1, sp2],
			} as unknown as IPagedEntities<Booking>),
		);
		const controller = Container.get(ServiceProvidersController);
		const result = await controller.getServiceProviders(undefined, true);
		expect(result.data.length).toBe(2);
		expect(result.data[0].timeslotsSchedule.timeslots[0].weekDay).toBe(timeslotItem._weekDay);
	});

	it('should get a service provider', async () => {
		ServiceProvidersServiceMock.getServiceProviderMock.mockReturnValue(
			ServiceProvider.create('Monica', 1, null, null, null, null, 'description', 'alias name'),
		);

		const controller = Container.get(ServiceProvidersController);
		const result = await controller.getServiceProvider(1);

		expect(result.data.name).toEqual('Monica');
		expect(result.data.description).toEqual('description');
		expect(result.data.aliasName).toEqual('alias name');
	});

	it('should get provider scheduleForm', async () => {
		ServiceProvidersServiceMock.getProviderScheduleFormMock.mockReturnValue(Promise.resolve(new ScheduleForm()));
		await Container.get(ServiceProvidersController).getServiceScheduleForm(1);

		expect(ServiceProvidersServiceMock.getProviderScheduleFormMock).toBeCalled();
	});

	it('should get provider timeslots scheduleForm', async () => {
		const mockItemId = 11;
		const mockResult = new TimeslotsSchedule();
		mockItem._id = mockItemId;
		mockResult.timeslotItems = [mockItem];
		ServiceProvidersServiceMock.getTimeslotItemsByServiceProviderIdMock.mockReturnValue(mockResult);
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
		ServiceProvidersServiceMock.getAvailableServiceProvidersMock.mockReturnValue(Promise.resolve([sp1]));
		const result = await Container.get(ServiceProvidersController).getAvailableServiceProviders(
			startDate,
			endDate,
			1,
		);

		expect(ServiceProvidersServiceMock.getAvailableServiceProvidersMock).toBeCalledWith(
			startDate,
			endDate,
			false,
			1,
		);

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
		ServiceProvidersServiceMock.getAvailableServiceProvidersMock
			.mockImplementationOnce(() => Promise.resolve([sp1]))
			.mockImplementationOnce(() => Promise.resolve([sp3]));
		const result = await Container.get(ServiceProvidersController).getAvailableServiceProviders(startDate, endDate);

		expect(ServiceProvidersServiceMock.getAvailableServiceProvidersMock).toBeCalledTimes(2);
		expect(ServiceProvidersServiceMock.getAvailableServiceProvidersMock.mock.calls[0]).toEqual([
			startDate,
			endDate,
			false,
			1,
		]);

		expect(result.data.length).toBe(2);
		expect(result.data[0].serviceId).toBe(1);
		expect(result.data[1].serviceId).toBe(2);
	});

	it('should save multiple service providers', async () => {
		ServiceProvidersServiceMock.saveMock.mockReturnValue([
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
		const listRequest = ServiceProvidersServiceMock.saveMock.mock.calls[0][0] as ServiceProvider[];

		expect(listRequest.length).toBe(1);
	});

	it('should save multiple service providers as text', async () => {
		ServiceProvidersServiceMock.saveMock.mockReturnValue([
			ServiceProvider.create('Monica', 1),
			ServiceProvider.create('Timmy', 1),
		]);
		const controller = Container.get(ServiceProvidersController);

		await controller.addServiceProvidersText('name\nJohn\nMary\nJuliet\n', 1);

		const listRequest = ServiceProvidersServiceMock.saveMock.mock.calls[0][0] as ServiceProvider[];

		expect(listRequest.length).toBe(3);
	});

	it('should set provider scheduleForm', async () => {
		ServiceProvidersServiceMock.setProviderScheduleFormMock.mockReturnValue(Promise.resolve(new ScheduleForm()));
		const providerScheduleFormRequest = new ScheduleFormRequest();
		await Container.get(ServiceProvidersController).setServiceScheduleForm(1, providerScheduleFormRequest);
		expect(ServiceProvidersServiceMock.setProviderScheduleFormMock).toBeCalled();
	});

	it('should update a service provider', async () => {
		ServiceProvidersServiceMock.updateServiceProviderMock.mockReturnValue(
			ServiceProvider.create('Test', 1, 'test@gmail.com', '123', null, null, 'updated desc', 'updated alias'),
		);
		const controller = Container.get(ServiceProvidersController);
		const result = await controller.updateServiceProvider(1, {
			name: 'Test',
			email: 'test@gmail.com',
		});
		expect(ServiceProvidersServiceMock.updateServiceProviderMock).toBeCalled();
		expect(result.data.email).toEqual('test@gmail.com');
		expect(result.data.phone).toEqual('123');
		expect(result.data.description).toEqual('updated desc');
		expect(result.data.aliasName).toBe('updated alias');
	});

	it('should set provider schedule timeslots', async () => {
		ServiceProvidersServiceMock.createTimeslotItemForServiceProviderMock.mockReturnValue(mockItem);

		const response = await Container.get(ServiceProvidersController).createTimeslotItem(1, request);
		expect(response).toBeDefined();
		expect(response.data.startTime).toEqual('08:00');
	});

	it('should update provider schedule timeslots', async () => {
		ServiceProvidersServiceMock.updateTimeslotItemForServiceProviderMock.mockReturnValue(mockItem);
		const response = await Container.get(ServiceProvidersController).updateTimeslotItem(1, 1, request);
		expect(ServiceProvidersServiceMock.updateTimeslotItemForServiceProviderMock).toBeCalled();
		expect(response.data.startTime).toEqual('08:00');
	});

	it('should call deleteTimeslotForServiceProvider', async () => {
		ServiceProvidersServiceMock.deleteTimeslotForServiceProviderMock.mockReturnValue(mockItem);
		await Container.get(ServiceProvidersController).deleteTimeslotItem(1, 1);
		expect(ServiceProvidersServiceMock.deleteTimeslotForServiceProviderMock).toBeCalled();
	});
});

// tslint:disable-next-line:no-big-function
describe('ServiceProviders.Controller.V2', () => {
	const sp1 = ServiceProvider.create('Monica', 1);
	const sp2 = ServiceProvider.create('Timmy', 1);

	const mockItem = new TimeslotItem();
	const request = new TimeslotItemRequest();
	const adminMock = User.createAdminUser({
		molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
		userName: 'UserName',
		email: 'test@email.com',
		name: 'Name',
	});

	beforeEach(() => {
		jest.resetAllMocks();
		jest.clearAllMocks();

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));

		mockItem._id = 11;
		mockItem._startTime = TimeOfDay.create({ hours: 8, minutes: 0 });
		mockItem._endTime = TimeOfDay.create({ hours: 9, minutes: 0 });

		request.weekDay = 4;
		request.startTime = '08:00';
		request.endTime = '09:00';

		IdHasherMock.decode.mockImplementation((id: string) => Number(id));
		IdHasherMock.encode.mockImplementation((id: number) => String(id));
	});

	it('should save multiple service providers', async () => {
		ServiceProvidersServiceMock.saveMock.mockReturnValue([
			ServiceProvider.create('Monica', 1),
			ServiceProvider.create('Timmy', 1),
		]);
		const controller = Container.get(ServiceProvidersControllerV2);
		await controller.addServiceProviders(
			{
				serviceProviders: [
					{
						name: 'Test',
					},
				],
			},
			'1',
		);
		const listRequest = ServiceProvidersServiceMock.saveMock.mock.calls[0][0] as ServiceProvider[];

		expect(listRequest.length).toBe(1);
	});

	it('should save multiple service providers as text', async () => {
		ServiceProvidersServiceMock.saveMock.mockReturnValue([
			ServiceProvider.create('Monica', 1),
			ServiceProvider.create('Timmy', 1),
		]);
		const controller = Container.get(ServiceProvidersControllerV2);

		await controller.addServiceProvidersText('name\nJohn\nMary\nJuliet\n', '1');

		const listRequest = ServiceProvidersServiceMock.saveMock.mock.calls[0][0] as ServiceProvider[];

		expect(listRequest.length).toBe(3);
	});

	it('should get service providers', async () => {
		ServiceProvidersServiceMock.getServiceProvidersMock.mockImplementation(() =>
			Promise.resolve({
				entries: [sp1, sp2],
			} as unknown as IPagedEntities<Booking>),
		);
		ServiceProvidersServiceMock.getPagedServiceProvidersMock.mockImplementation(() =>
			Promise.resolve({
				entries: [sp1, sp2],
			} as unknown as IPagedEntities<Booking>),
		);
		const controller = Container.get(ServiceProvidersController);
		const result = await controller.getServiceProviders();
		expect(result.data.length).toBe(2);
	});

	it('should get total service providers', async () => {
		const controller = Container.get(ServiceProvidersControllerV2);
		const serviceId = '1';
		await controller.getTotalServiceProviders(serviceId);
		expect(ServiceProvidersServiceMock.getServiceProvidersCountMock).toHaveBeenCalled();
	});

	it('should search SP by name', async () => {
		ServiceProvidersServiceMock.getServiceProvidersByNameMock.mockReturnValue([sp1]);
		const serviceId = '1';
		const controller = Container.get(ServiceProvidersControllerV2);
		await controller.getServiceProvidersByName('mon', serviceId);
		expect(ServiceProvidersServiceMock.getServiceProvidersByNameMock).toHaveBeenCalled();
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
		ServiceProvidersServiceMock.getPagedServiceProvidersMock.mockImplementation(() =>
			Promise.resolve({
				entries: [sp1, sp2],
			} as unknown as IPagedEntities<Booking>),
		);
		const controller = Container.get(ServiceProvidersController);
		const result = await controller.getServiceProviders(undefined, true);
		expect(result.data.length).toBe(2);
		expect(result.data[0].timeslotsSchedule.timeslots[0].weekDay).toBe(timeslotItem._weekDay);
	});

	describe('getServiceProvider API', () => {
		it('should get a service provider', async () => {
			ServiceProvidersServiceMock.getServiceProviderMock.mockReturnValue(
				ServiceProvider.create('Monica', 1, null, null, null, null, 'description', 'alias name'),
			);
			const serviceId = '1';

			const controller = Container.get(ServiceProvidersControllerV2);
			const result = await controller.getServiceProvider(serviceId);

			expect(result.data.name).toEqual('Monica');
			expect(result.data.description).toEqual('description');
			expect(result.data.aliasName).toEqual('alias name');
		});

		it('should get a service provider with labels', async () => {
			const label = ServiceProviderLabel.create('English');
			ServiceProvidersServiceMock.getServiceProviderMock.mockReturnValue(
				ServiceProvider.create('Monica', 1, null, null, null, null, 'description', 'alias name', [label]),
			);
			const serviceId = '1';

			const controller = Container.get(ServiceProvidersControllerV2);
			const result = await controller.getServiceProvider(serviceId);

			expect(result.data.labels[0].name).toEqual(label.labelText);
		});
	});

	it('should get provider scheduleForm', async () => {
		ServiceProvidersServiceMock.getProviderScheduleFormMock.mockReturnValue(Promise.resolve(new ScheduleForm()));
		const spId = '1';
		await Container.get(ServiceProvidersControllerV2).getServiceScheduleForm(spId);

		expect(ServiceProvidersServiceMock.getProviderScheduleFormMock).toBeCalled();
	});

	it('should get provider timeslots scheduleForm', async () => {
		const mockItemId = 11;
		const mockResult = new TimeslotsSchedule();
		mockItem._id = mockItemId;
		mockResult.timeslotItems = [mockItem];
		ServiceProvidersServiceMock.getTimeslotItemsByServiceProviderIdMock.mockReturnValue(mockResult);
		const spId = '1';
		const response = await Container.get(ServiceProvidersControllerV2).getTimeslotsScheduleByServiceProviderId(
			spId,
		);
		expect(response.data.timeslots.length).toEqual(1);
		expect(response.data.timeslots[0].id).toEqual('11');
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
		ServiceProvidersServiceMock.getAvailableServiceProvidersMock.mockReturnValue(Promise.resolve([sp1]));
		const serviceId = '1';
		const result = await Container.get(ServiceProvidersControllerV2).getAvailableServiceProviders(
			startDate,
			endDate,
			serviceId,
		);

		expect(ServiceProvidersServiceMock.getAvailableServiceProvidersMock).toBeCalledWith(
			startDate,
			endDate,
			false,
			1,
		);

		expect(result.data.length).toBe(1);
		expect(result.data[0].serviceId).toBe('1');
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
		ServiceProvidersServiceMock.getAvailableServiceProvidersMock
			.mockImplementationOnce(() => Promise.resolve([sp1]))
			.mockImplementationOnce(() => Promise.resolve([sp3]));
		const result = await Container.get(ServiceProvidersControllerV2).getAvailableServiceProviders(
			startDate,
			endDate,
		);

		expect(ServiceProvidersServiceMock.getAvailableServiceProvidersMock).toBeCalledTimes(2);
		expect(ServiceProvidersServiceMock.getAvailableServiceProvidersMock.mock.calls[0]).toEqual([
			startDate,
			endDate,
			false,
			1,
		]);

		expect(result.data.length).toBe(2);
		expect(result.data[0].serviceId).toBe('1');
	});

	it('should set provider scheduleForm', async () => {
		ServiceProvidersServiceMock.setProviderScheduleFormMock.mockReturnValue(Promise.resolve(new ScheduleForm()));
		const spId = '1';
		const providerScheduleFormRequest = new ScheduleFormRequest();
		await Container.get(ServiceProvidersControllerV2).setServiceScheduleForm(spId, providerScheduleFormRequest);
		expect(ServiceProvidersServiceMock.setProviderScheduleFormMock).toBeCalled();
	});

	describe('updateServiceProvider API', () => {
		it('should update a service provider', async () => {
			ServiceProvidersServiceMock.updateServiceProviderMock.mockReturnValue(
				ServiceProvider.create('Test', 1, 'test@gmail.com', '123', null, null, 'updated desc', 'updated alias'),
			);
			const spId = '1';

			const controller = Container.get(ServiceProvidersControllerV2);
			const result = await controller.updateServiceProvider(spId, {
				name: 'Test',
				email: 'test@gmail.com',
			});
			expect(ServiceProvidersServiceMock.updateServiceProviderMock).toBeCalled();
			expect(result.data.email).toEqual('test@gmail.com');
			expect(result.data.phone).toEqual('123');
			expect(result.data.description).toEqual('updated desc');
			expect(result.data.aliasName).toBe('updated alias');
		});

		it('should update a service provider with labels', async () => {
			const label = ServiceProviderLabel.create('English');
			ServiceProvidersServiceMock.updateServiceProviderMock.mockReturnValue(
				ServiceProvider.create(
					'Test',
					1,
					'test@gmail.com',
					'123',
					null,
					null,
					'updated desc',
					'updated alias',
					[label],
				),
			);
			const spId = '1';

			const controller = Container.get(ServiceProvidersControllerV2);
			const result = await controller.updateServiceProvider(spId, {
				name: 'Test',
				email: 'test@gmail.com',
			});
			expect(ServiceProvidersServiceMock.updateServiceProviderMock).toBeCalled();
			expect(result.data.labels[0].name).toEqual(label.labelText);
		});
	});

	it('should set provider schedule timeslots', async () => {
		ServiceProvidersServiceMock.createTimeslotItemForServiceProviderMock.mockReturnValue(mockItem);
		const spId = '1';
		const response = await Container.get(ServiceProvidersControllerV2).createTimeslotItem(spId, request);
		expect(response).toBeDefined();
		expect(response.data.startTime).toEqual('08:00');
	});

	it('should update provider schedule timeslots', async () => {
		ServiceProvidersServiceMock.updateTimeslotItemForServiceProviderMock.mockReturnValue(mockItem);
		const spId = '1';
		const response = await Container.get(ServiceProvidersControllerV2).updateTimeslotItem(spId, '1', request);
		expect(ServiceProvidersServiceMock.updateTimeslotItemForServiceProviderMock).toBeCalled();
		expect(response.data.startTime).toEqual('08:00');
	});

	it('should call deleteTimeslotForServiceProvider', async () => {
		ServiceProvidersServiceMock.deleteTimeslotForServiceProviderMock.mockReturnValue(mockItem);
		const spId = '1';
		await Container.get(ServiceProvidersControllerV2).deleteTimeslotItem(spId, '1');
		expect(ServiceProvidersServiceMock.deleteTimeslotForServiceProviderMock).toBeCalled();
	});

	it('should call deleteTimeslotForServiceProvider', async () => {
		ServiceProvidersServiceMock.deleteTimeslotForServiceProviderMock.mockReturnValue(mockItem);
		await Container.get(ServiceProvidersControllerV2).deleteTimeslotItem('1', '1');
		expect(ServiceProvidersServiceMock.deleteTimeslotForServiceProviderMock).toBeCalled();
	});
});

class ServicesServiceMock implements Partial<ServicesService> {
	public static getServices = jest.fn();

	public async getServices(): Promise<Service[]> {
		return ServicesServiceMock.getServices();
	}
}
