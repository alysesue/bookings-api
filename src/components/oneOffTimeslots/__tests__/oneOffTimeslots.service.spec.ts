import { DateHelper } from '../../../infrastructure/dateHelper';
import { Container } from 'typescript-ioc';
import { OneOffTimeslotRequestV1 } from '../oneOffTimeslots.apicontract';
import { OneOffTimeslotsService } from '../oneOffTimeslots.service';
import { UserContext } from '../../../infrastructure/auth/userContext';
import { Event, Label, OneOffTimeslot, Service, ServiceProvider, User } from '../../../models';
import { AuthGroup } from '../../../infrastructure/auth/authGroup';
import { OneOffTimeslotsRepository } from '../oneOffTimeslots.repository';
import { ServiceProvidersService } from '../../serviceProviders/serviceProviders.service';
import { OneOffTimeslotsActionAuthVisitor } from '../oneOffTimeslots.auth';
import { LabelsService } from '../../labels/labels.service';
import { IdHasherMock } from '../../../infrastructure/__mocks__/idHasher.mock';
import { IdHasher } from '../../../infrastructure/idHasher';
import { ContainerContextHolder } from '../../../infrastructure/containerContext';
import { ServicesService } from '../../services/services.service';
import { ServicesServiceMock } from '../../services/__mocks__/services.service';
import { EventsServiceMock } from '../../events/__mocks__/events.service.mock';
import { EventsService } from '../../events/events.service';
import { EventOneOffTimeslotRequest } from '../../events/events.apicontract';

jest.mock('../oneOffTimeslots.auth');

describe('OneOffTimeslots Service Tests', () => {
	const authVisitorMock: Partial<OneOffTimeslotsActionAuthVisitor> = {
		hasPermission: jest.fn(),
	};

	const serviceProvider = new ServiceProvider();
	serviceProvider.id = 1;
	serviceProvider.name = 'John';
	const newService = new Service();
	newService.id = 1;
	serviceProvider.service = newService;

	beforeAll(() => {
		ContainerContextHolder.registerInContainer();

		Container.bind(IdHasher).to(IdHasherMock);
		Container.bind(OneOffTimeslotsRepository).to(OneOffTimeslotsRepositoryMock);
		Container.bind(UserContext).to(UserContextMock);
		Container.bind(ServiceProvidersService).to(ServiceProvidersServiceMock);
		Container.bind(ServicesService).to(ServicesServiceMock);
		Container.bind(LabelsService).to(LabelServiceMock);
		Container.bind(EventsService).to(EventsServiceMock);
	});

	beforeEach(() => {
		jest.resetAllMocks();

		(OneOffTimeslotsActionAuthVisitor as jest.Mock).mockImplementation(() => authVisitorMock);
		(authVisitorMock.hasPermission as jest.Mock).mockReturnValue(true);
		UserContextMock.getAuthGroups.mockReturnValue(Promise.resolve([]));
		ServiceProvidersServiceMock.getServiceProvider.mockImplementation(() => {
			return serviceProvider;
		});

		ServicesServiceMock.getService.mockImplementation(() => {
			return newService;
		});

		LabelServiceMock.verifyLabels.mockReturnValue(Promise.resolve([]));
	});

	it('should save using event service', async () => {
		EventsServiceMock.saveOneOffTimeslot.mockReturnValue(() => {});
		OneOffTimeslotsRepositoryMock.search.mockImplementation(() => []);
		LabelServiceMock.verifyLabels.mockReturnValue(Promise.resolve([Label.create('Chinese')]));

		const request = new OneOffTimeslotRequestV1();
		request.startDateTime = new Date('2021-03-02T00:00:00Z');
		request.endDateTime = DateHelper.addHours(request.startDateTime, 1);
		request.capacity = 2;
		request.serviceProviderId = 1;
		request.labelIds = ['Chinese'];

		const service = Container.get(OneOffTimeslotsService);
		await service.save(request);

		expect(EventsServiceMock.saveOneOffTimeslot).toBeCalled();
		const parameter0 = EventsServiceMock.saveOneOffTimeslot.mock.calls[0][0] as EventOneOffTimeslotRequest;
		expect(parameter0.timeslot.startDateTime).toEqual(new Date('2021-03-02T00:00:00Z'));
		expect(parameter0.timeslot.endDateTime).toEqual(new Date('2021-03-02T01:00:00Z'));
		expect(parameter0.capacity).toBe(2);
		expect(parameter0.labelIds[0]).toEqual(request.labelIds[0]);

		expect(ServiceProvidersServiceMock.getServiceProvider).toBeCalled();
	});

	it(`should throw when user doesn't have permisssion`, async () => {
		(authVisitorMock.hasPermission as jest.Mock).mockReturnValue(false);
		OneOffTimeslotsRepositoryMock.save.mockImplementation(() => {});
		OneOffTimeslotsRepositoryMock.search.mockImplementation(() => []);

		const request = new OneOffTimeslotRequestV1();
		request.startDateTime = new Date('2021-03-02T00:00:00Z');
		request.endDateTime = DateHelper.addHours(request.startDateTime, 1);
		request.capacity = 2;
		request.serviceProviderId = 1;

		const service = Container.get(OneOffTimeslotsService);
		const asyncTest = async () => await service.save(request);

		await expect(asyncTest).rejects.toThrowErrorMatchingInlineSnapshot(
			'"User cannot perform this action for this one off timeslot."',
		);
	});

	it('should update one off timeslots', async () => {
		const oneOffTimeslots = new OneOffTimeslot();
		oneOffTimeslots.id = 1;
		oneOffTimeslots.startDateTime = new Date('2021-03-02T00:00:00Z');
		oneOffTimeslots.endDateTime = DateHelper.addHours(oneOffTimeslots.startDateTime, 1);
		oneOffTimeslots.serviceProviderId = 1;
		const event = new Event();
		event.id = 1;
		event.oneOffTimeslots = [oneOffTimeslots];
		event.capacity = 2;
		EventsServiceMock.getById.mockReturnValue(event);
		OneOffTimeslotsRepositoryMock.save.mockReturnValue({});
		OneOffTimeslotsRepositoryMock.search.mockImplementation(() => []);

		const request = new OneOffTimeslotRequestV1();
		request.startDateTime = new Date('2021-03-02T00:00:00Z');
		request.endDateTime = DateHelper.addHours(request.startDateTime, 1);
		request.capacity = 2;
		request.serviceProviderId = 1;

		const service = Container.get(OneOffTimeslotsService);
		await service.update(request, '1');

		expect(EventsServiceMock.getById).toBeCalled();
		expect(EventsServiceMock.updateOneOffTimeslot).toBeCalled();
	});

	it('should delete one off timeslots', async () => {
		const oneOffTimeslots = new OneOffTimeslot();
		oneOffTimeslots.id = 1;
		oneOffTimeslots.startDateTime = new Date('2021-03-02T00:00:00Z');
		oneOffTimeslots.endDateTime = new Date('2021-03-02T02:00:00Z');
		const event = new Event();
		event.id = 1;
		event.oneOffTimeslots = [oneOffTimeslots];
		event.capacity = 2;
		EventsServiceMock.getById.mockReturnValue(event);
		IdHasherMock.decode.mockReturnValue(1);

		OneOffTimeslotsRepositoryMock.delete.mockReturnValue(Promise.resolve());
		const service = Container.get(OneOffTimeslotsService);
		await service.delete('1');

		expect(EventsServiceMock.getById).toBeCalled();
		expect(EventsServiceMock.delete).toBeCalledWith({
			_capacity: 2,
			_id: 1,
			_oneOffTimeslots: [
				{
					_endDateTime: new Date('2021-03-02T02:00:00.000Z'),
					_id: 1,
					_startDateTime: new Date('2021-03-02T00:00:00.000Z'),
				},
			],
		});
	});
});

class ServiceProvidersServiceMock implements Partial<ServiceProvidersService> {
	public static getServiceProvider = jest.fn();

	public async getServiceProvider(...params): Promise<any> {
		return ServiceProvidersServiceMock.getServiceProvider(...params);
	}
}

class OneOffTimeslotsRepositoryMock implements Partial<OneOffTimeslotsRepository> {
	public static save = jest.fn();
	public static delete = jest.fn();
	public static getById = jest.fn();
	public static search = jest.fn();

	public async save(...params): Promise<any> {
		return OneOffTimeslotsRepositoryMock.save(...params);
	}

	public async delete(...params): Promise<any> {
		return OneOffTimeslotsRepositoryMock.delete(...params);
	}

	public async getById(...params): Promise<any> {
		return OneOffTimeslotsRepositoryMock.getById(...params);
	}

	public async search(...params): Promise<any> {
		return OneOffTimeslotsRepositoryMock.search(...params);
	}
}

class UserContextMock implements Partial<UserContext> {
	public static getCurrentUser = jest.fn<Promise<User>, any>();
	public static getAuthGroups = jest.fn<Promise<AuthGroup[]>, any>();

	public init() {}
	public async getCurrentUser(...params): Promise<any> {
		return await UserContextMock.getCurrentUser(...params);
	}

	public async getAuthGroups(...params): Promise<any> {
		return await UserContextMock.getAuthGroups(...params);
	}
}

class LabelServiceMock implements Partial<LabelsService> {
	public static verifyLabels = jest.fn<Promise<Label[]>, any>();
	public verifyLabels(...params): Promise<Label[]> {
		return LabelServiceMock.verifyLabels(...params);
	}
}
