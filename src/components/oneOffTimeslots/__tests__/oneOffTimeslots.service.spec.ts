import { DateHelper } from '../../../infrastructure/dateHelper';
import { Container } from 'typescript-ioc';
import { OneOffTimeslotRequest } from '../oneOffTimeslots.apicontract';
import { OneOffTimeslotsService } from '../oneOffTimeslots.service';
import { UserContext } from '../../../infrastructure/auth/userContext';
import { Label, OneOffTimeslot, Service, ServiceProvider, User } from '../../../models';
import { AuthGroup } from '../../../infrastructure/auth/authGroup';
import { OneOffTimeslotsRepository } from '../oneOffTimeslots.repository';
import { ServiceProvidersService } from '../../../components/serviceProviders/serviceProviders.service';
import { OneOffTimeslotsActionAuthVisitor } from '../oneOffTimeslots.auth';
import { LabelsService } from '../../../components/labels/labels.service';

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
		Container.bind(OneOffTimeslotsRepository).to(OneOffTimeslotsRepositoryMock);
		Container.bind(UserContext).to(UserContextMock);
		Container.bind(ServiceProvidersService).to(ServiceProvidersServiceMock);
		Container.bind(LabelsService).to(LabelServiceMock);
	});

	beforeEach(() => {
		jest.resetAllMocks();

		(OneOffTimeslotsActionAuthVisitor as jest.Mock).mockImplementation(() => authVisitorMock);
		(authVisitorMock.hasPermission as jest.Mock).mockReturnValue(true);
		UserContextMock.getAuthGroups.mockReturnValue(Promise.resolve([]));
		ServiceProvidersServiceMock.getServiceProvider.mockImplementation(() => {
			return serviceProvider;
		});

		LabelServiceMock.verifyLabels.mockReturnValue(Promise.resolve([]));
	});

	it('should save using repository', async () => {
		OneOffTimeslotsRepositoryMock.save.mockImplementation(() => {});
		LabelServiceMock.verifyLabels.mockReturnValue(Promise.resolve([Label.create('Chinese')]));

		const request = new OneOffTimeslotRequest();
		request.startDateTime = new Date('2021-03-02T00:00:00Z');
		request.endDateTime = DateHelper.addHours(request.startDateTime, 1);
		request.capacity = 2;
		request.serviceProviderId = 1;
		request.labelIds = ['Chinese'];

		const service = Container.get(OneOffTimeslotsService);
		await service.save(request);

		expect(OneOffTimeslotsRepositoryMock.save).toBeCalled();
		const parameter0 = OneOffTimeslotsRepositoryMock.save.mock.calls[0][0] as OneOffTimeslot;
		expect(parameter0.startDateTime).toEqual(new Date('2021-03-02T00:00:00Z'));
		expect(parameter0.endDateTime).toEqual(new Date('2021-03-02T01:00:00Z'));
		expect(parameter0.capacity).toBe(2);
		expect(parameter0.labels[0].labelText).toEqual(request.labelIds[0]);

		expect(ServiceProvidersServiceMock.getServiceProvider).toBeCalled();
	});

	it(`should throw when user doesn't have permisssion`, async () => {
		(authVisitorMock.hasPermission as jest.Mock).mockReturnValue(false);
		OneOffTimeslotsRepositoryMock.save.mockImplementation(() => {});

		const request = new OneOffTimeslotRequest();
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

	it(`should validate dates`, async () => {
		OneOffTimeslotsRepositoryMock.save.mockImplementation(() => {});

		const request = new OneOffTimeslotRequest();
		const date = new Date('2021-03-02T00:00:00Z');
		request.startDateTime = DateHelper.addHours(date, 1);
		request.endDateTime = date;
		request.capacity = 2;
		request.serviceProviderId = 1;

		const service = Container.get(OneOffTimeslotsService);
		const asyncTest = async () => await service.save(request);

		await expect(asyncTest).rejects.toThrowErrorMatchingInlineSnapshot('"Start time must be less than end time."');
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

	public async save(...params): Promise<any> {
		return OneOffTimeslotsRepositoryMock.save(...params);
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
