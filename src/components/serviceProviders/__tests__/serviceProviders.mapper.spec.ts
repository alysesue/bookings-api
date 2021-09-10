import { Organisation, Service, ServiceProvider, User } from '../../../models/entities';
import { ServiceProvidersMapper } from '../serviceProviders.mapper';
import { Container } from 'typescript-ioc';
import { IdHasher } from '../../../infrastructure/idHasher';
import { IdHasherMock } from '../../../infrastructure/__mocks__/idHasher.mock';
import { UserContext } from '../../../infrastructure/auth/userContext';
import { UserContextMock } from '../../../infrastructure/auth/__mocks__/userContext';
import { TimeslotItemsMapper } from '../../timeslotItems/timeslotItems.mapper';
import { ScheduleFormsMapper } from '../../scheduleForms/scheduleForms.mapper';
import { TimeslotItemsMapperMock } from '../../timeslotItems/__mocks__/timeslotItems.mapper.mock';
import { ScheduleFormsMapperMock } from '../../scheduleForms/__mocks__/scheduleForms.mapper.mock';
import { TimeslotsScheduleResponseV1 } from '../../timeslotItems/timeslotItems.apicontract';
import { ScheduleFormResponseV1 } from '../../scheduleForms/scheduleForms.apicontract';
import { MolServiceProviderOnboard, ServiceProviderModel } from '../serviceProviders.apicontract';

describe('Service providers mapper tests', () => {
	beforeAll(() => {
		Container.bind(UserContext).to(UserContextMock);
		Container.bind(IdHasher).to(IdHasherMock);
		Container.bind(TimeslotItemsMapper).to(TimeslotItemsMapperMock);
		Container.bind(ScheduleFormsMapper).to(ScheduleFormsMapperMock);
	});

	beforeEach(() => {
		jest.resetAllMocks();
		jest.clearAllMocks();
	});

	it('should map data model V1', async () => {
		const serviceProvider = ServiceProvider.create('SP1', 1, 'sp1@email.com');
		const options = { includeTimeslotsSchedule: true, includeScheduleForm: true };

		TimeslotItemsMapperMock.mapToTimeslotsScheduleResponseV1.mockReturnValue(new TimeslotsScheduleResponseV1());
		ScheduleFormsMapperMock.mapToResponseV1.mockReturnValue(new ScheduleFormResponseV1());
		await UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(new User()));

		const mapper = Container.get(ServiceProvidersMapper);
		const result = await mapper.mapDataModelV1(serviceProvider, options);
		expect(result).toEqual({
			name: 'SP1',
			scheduleForm: {},
			scheduleFormConfirmed: false,
			serviceId: 1,
			timeslotsSchedule: {},
		});
	});

	it('should map data model V2', async () => {
		const serviceProvider = ServiceProvider.create('SP1', 1, 'sp1@email.com');
		serviceProvider.id = 100;
		const options = { includeTimeslotsSchedule: true, includeScheduleForm: true };

		TimeslotItemsMapperMock.mapToTimeslotsScheduleResponseV1.mockReturnValue(new TimeslotsScheduleResponseV1());
		ScheduleFormsMapperMock.mapToResponseV1.mockReturnValue(new ScheduleFormResponseV1());
		await UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(new User()));
		IdHasherMock.encode.mockImplementation((id: number) => String(id));

		const mapper = Container.get(ServiceProvidersMapper);
		const result = await mapper.mapDataModelV2(serviceProvider, options);
		expect(result).toEqual({
			name: 'SP1',
			scheduleFormConfirmed: false,
			serviceId: '1',
			id: '100',
		});
	});

	it('should map multiple data models V1', async () => {
		const serviceProvider = ServiceProvider.create('SP1', 1, 'sp1@email.com');
		const options = { includeTimeslotsSchedule: true, includeScheduleForm: true };

		TimeslotItemsMapperMock.mapToTimeslotsScheduleResponseV1.mockReturnValue(new TimeslotsScheduleResponseV1());
		ScheduleFormsMapperMock.mapToResponseV1.mockReturnValue(new ScheduleFormResponseV1());
		await UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(new User()));

		const mapper = Container.get(ServiceProvidersMapper);
		const result = await mapper.mapDataModelsV1([serviceProvider], options);
		expect(result).toEqual([
			{
				name: 'SP1',
				scheduleForm: {},
				scheduleFormConfirmed: false,
				serviceId: 1,
				timeslotsSchedule: {},
			},
		]);
	});

	it('should map multiple data models V2', async () => {
		const serviceProvider = ServiceProvider.create('SP1', 1, 'sp1@email.com');
		serviceProvider.id = 100;
		const options = { includeTimeslotsSchedule: true, includeScheduleForm: true };

		TimeslotItemsMapperMock.mapToTimeslotsScheduleResponseV1.mockReturnValue(new TimeslotsScheduleResponseV1());
		ScheduleFormsMapperMock.mapToResponseV1.mockReturnValue(new ScheduleFormResponseV1());
		await UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(new User()));
		IdHasherMock.encode.mockImplementation((id: number) => String(id));

		const mapper = Container.get(ServiceProvidersMapper);
		const result = await mapper.mapDataModelsV2([serviceProvider], options);
		expect(result).toEqual([
			{
				name: 'SP1',
				scheduleFormConfirmed: false,
				serviceId: '1',
				id: '100',
			},
		]);
	});

	it('should map summary data models V1', () => {
		const serviceProvider = new ServiceProvider();
		serviceProvider.id = 1;
		serviceProvider.name = 'SP1';
		serviceProvider.email = 'sp1@email.com';

		const mapper = Container.get(ServiceProvidersMapper);
		const result = mapper.mapSummaryDataModelsV1([serviceProvider]);
		expect(result).toEqual([
			{
				id: 1,
				name: 'SP1',
			},
		]);
	});

	it('should map summary data models V2', () => {
		const serviceProvider = new ServiceProvider();
		serviceProvider.id = 1;
		serviceProvider.name = 'SP1';
		serviceProvider.email = 'sp1@email.com';

		IdHasherMock.encode.mockImplementation((id: number) => String(id));

		const mapper = Container.get(ServiceProvidersMapper);
		const result = mapper.mapSummaryDataModelsV2([serviceProvider]);
		expect(result).toEqual([
			{
				id: '1',
				name: 'SP1',
			},
		]);
	});

	it('should map to entity', () => {
		const molServiceProviderOnboard = new MolServiceProviderOnboard();
		molServiceProviderOnboard.molAdminId = '123';
		molServiceProviderOnboard.username = 'ServiceProvider1';
		molServiceProviderOnboard.groups = [];
		const organisation = new Organisation();
		organisation.id = 1;
		const service = Service.create('Service1', organisation);
		const serviceProvider = ServiceProvider.create('SP1', 1, 'sp1@email.com');

		const mapper = Container.get(ServiceProvidersMapper);
		const result = mapper.mapToEntity(molServiceProviderOnboard, service, serviceProvider);
		expect(result.service).toBe(service);
		expect(result.serviceId).toBe(service.id);

		expect(result.serviceProviderGroupMap).toEqual({
			_molAdminId: '123',
		});
	});

	it('should map service provider model to entity', () => {
		const serviceProviderModel = new ServiceProviderModel('SP1');
		const serviceProvider = new ServiceProvider();

		const mapper = Container.get(ServiceProvidersMapper);
		const result = mapper.mapServiceProviderModelToEntity(serviceProviderModel, serviceProvider);
		expect(result).toEqual({
			_expiryDate: null,
			_name: 'SP1',
		});
	});
});
