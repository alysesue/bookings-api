import {
	Booking,
	BookingChangeLog,
	BusinessValidation,
	Organisation,
	SelectListDynamicField,
	SelectListOption,
	Service,
	ServiceProvider,
	User,
} from '../../../models';
import { BookingsMapper } from '../bookings.mapper';
import { UinFinConfiguration } from '../../../models/uinFinConfiguration';
import { DynamicValueJsonModel, DynamicValueType } from '../../../models/entities/jsonModels';
import { Container } from 'typescript-ioc';
import { IdHasher } from '../../../infrastructure/idHasher';
import { IdHasherMock } from '../../../infrastructure/__mocks__/idHasher.mock';
import { PersistDynamicValueContract } from '../../dynamicFields/dynamicValues.apicontract';
import { DynamicFieldsServiceMock } from '../../dynamicFields/__mocks__/dynamicFields.service.mock';
import { BookingDetailsRequest } from '../bookings.apicontract';
import { bookingStatusArray } from '../../../models/bookingStatus';
import { IBookingsValidator } from '../validator/bookings.validation';
import { UserContextMock } from '../../../infrastructure/auth/__mocks__/userContext';
import { BookingBuilder } from '../../../models/entities/booking';
import {
	DynamicValuesMapper,
	DynamicValuesRequestMapper,
	MapRequestOptionalResult,
} from '../../dynamicFields/dynamicValues.mapper';
import { UserContext } from '../../../infrastructure/auth/userContext';
import { DynamicValuesRequestMapperMock } from '../../dynamicFields/__mocks__/dynamicValues.mapper.mock';
import { DynamicValuesMapperMock } from '../../dynamicFields/__mocks__/dynamicValues.mapper.mock';
import { MyInfoResponse } from '../../../models/myInfoTypes';
import { UinFinConfigurationMock } from '../../../models/__mocks__/uinFinConfiguration.mock';

jest.mock('../../../models/uinFinConfiguration');
jest.mock('../../../components/dynamicFields/dynamicValues.mapper');

beforeAll(() => {
	Container.bind(IdHasher).to(IdHasherMock);
	Container.bind(UserContext).to(UserContextMock);
	Container.bind(DynamicValuesRequestMapper).to(DynamicValuesRequestMapperMock);
	Container.bind(DynamicValuesMapper).to(DynamicValuesMapperMock);
});

describe('Bookings mapper tests', () => {
	beforeEach(() => {
		jest.resetAllMocks();
		(UinFinConfiguration as jest.Mock).mockImplementation(() => new UinFinConfigurationMock());

		UserContextMock.getOtpAddOnMobileNo.mockReturnValue(undefined);
		UserContextMock.getMyInfo.mockReturnValue(Promise.resolve(undefined));
	});

	const userMock = User.createAdminUser({
		molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
		userName: 'UserName',
		email: 'test@email.com',
		name: 'Name',
	});

	const listOptions = {
		key: 1,
		value: 'English',
	} as SelectListOption;
	const dynamicFieldEntity = SelectListDynamicField.create(1, 'testDynamic', [listOptions], false);
	dynamicFieldEntity.id = 1;

	const organisation = new Organisation();
	organisation.name = 'agency1';
	organisation.id = 2;

	const getFullBookingInformation = () => {
		const booking = new Booking();
		const service = new Service();
		service.id = 1;
		service.name = `armin service`;
		service.organisation = organisation;
		const serviceProvider = new ServiceProvider();
		serviceProvider.name = `armin`;
		serviceProvider.email = `armin-sp@gmail.com`;
		serviceProvider.phone = `81181188`;
		const createdLog = new BookingChangeLog();
		createdLog.timestamp = new Date(2021, 2, 1);
		booking.id = 1;
		booking.uuid = '35703724-c99a-4fac-9546-d2b54c50b6fe';
		booking.status = 2;
		booking.createdLog = createdLog;
		booking.startDateTime = new Date(2021, 2, 1);
		booking.endDateTime = new Date(2021, 2, 1);
		booking.location = `somewhere`;
		booking.description = `description`;
		booking.refId = `123`;
		booking.dynamicValues = [
			{
				fieldId: 1,
				fieldName: 'testDynamic',
				type: 'SingleSelection' as DynamicValueType,
				singleSelectionKey: 1,
				singleSelectionValue: 'English',
			} as DynamicValueJsonModel,
		];
		booking.citizenName = `armin`;
		booking.citizenUinFin = `S1234567D`;
		booking.citizenEmail = `armin@gmail.com`;
		booking.citizenPhone = `81101234`;
		booking.service = service;
		booking.serviceProvider = serviceProvider;

		return booking;
	};

	it('should map booking response V1', async () => {
		const bookingsMapper = Container.get(BookingsMapper);
		const bookingBuilder = new BookingBuilder();
		bookingBuilder.citizenName = 'Citizen1';
		bookingBuilder.citizenEmail = 'citizen1@email.com';
		bookingBuilder.serviceId = 10;
		bookingBuilder.serviceProviderId = 100;
		const booking = Booking.create(bookingBuilder);
		booking.id = 1;
		booking.service = new Service();
		booking.service.organisation = new Organisation();

		const bookingResponse = await bookingsMapper.mapDataModelV1(booking);

		expect(bookingResponse).toEqual({
			citizenEmail: 'citizen1@email.com',
			citizenName: 'Citizen1',
			id: 1,
			serviceId: 10,
			serviceProviderId: 100,
			status: 1,
		});
	});

	it('should map array of booking responses V1', async () => {
		const bookingsMapper = Container.get(BookingsMapper);
		const bookingBuilder = new BookingBuilder();
		bookingBuilder.citizenName = 'Citizen1';
		bookingBuilder.citizenEmail = 'citizen1@email.com';
		bookingBuilder.serviceId = 10;
		bookingBuilder.serviceProviderId = 100;
		const booking = Booking.create(bookingBuilder);
		booking.id = 1;
		booking.service = new Service();
		booking.service.organisation = new Organisation();

		const bookingResponse = await bookingsMapper.mapDataModelsV1([booking]);

		expect(bookingResponse).toEqual([
			{
				_citizenEmail: 'citizen1@email.com',
				_citizenName: 'Citizen1',
				_id: 1,
				_service: {
					_organisation: {
						_configuration: {
							schemaVersion: 1,
						},
					},
				},
				_serviceId: 10,
				_serviceProviderId: 100,
				_status: 1,
				_version: 1,
			},
		]);
	});

	it('should map booking response V2', async () => {
		const bookingsMapper = Container.get(BookingsMapper);
		const bookingBuilder = new BookingBuilder();
		bookingBuilder.citizenName = 'Citizen1';
		bookingBuilder.citizenEmail = 'citizen1@email.com';
		bookingBuilder.serviceId = 10;
		bookingBuilder.serviceProviderId = 100;
		const booking = Booking.create(bookingBuilder);
		booking.id = 1;
		booking.service = new Service();
		booking.service.organisation = new Organisation();

		IdHasherMock.encode.mockImplementation((id: number) => String(id));

		const bookingResponse = await bookingsMapper.mapDataModelV2(booking);

		expect(bookingResponse).toEqual({
			citizenEmail: 'citizen1@email.com',
			citizenName: 'Citizen1',
			id: '1',
			serviceId: '10',
			serviceProviderId: '100',
			status: 1,
		});
	});

	it('should map array of booking responses V2', async () => {
		const bookingsMapper = Container.get(BookingsMapper);
		const bookingBuilder = new BookingBuilder();
		bookingBuilder.citizenName = 'Citizen1';
		bookingBuilder.citizenEmail = 'citizen1@email.com';
		bookingBuilder.serviceId = 10;
		bookingBuilder.serviceProviderId = 100;
		const booking = Booking.create(bookingBuilder);
		booking.id = 1;
		booking.service = new Service();
		booking.service.organisation = new Organisation();

		IdHasherMock.encode.mockImplementation((id: number) => String(id));

		const bookingResponse = await bookingsMapper.mapDataModelsV2([booking]);

		expect(bookingResponse).toEqual([
			{
				_citizenEmail: 'citizen1@email.com',
				_citizenName: 'Citizen1',
				_id: 1,
				_service: {
					_organisation: {
						_configuration: {
							schemaVersion: 1,
						},
					},
				},
				_serviceId: 10,
				_serviceProviderId: 100,
				_status: 1,
				_version: 1,
			},
		]);
	});

	it('should map booking provider V1', () => {
		const serviceProvider = ServiceProvider.create('SPI', 1, 'sp1@email.com');
		serviceProvider.id = 1;

		const bookingMapper = Container.get(BookingsMapper);
		const result = bookingMapper.mapProviderV1(serviceProvider);
		expect(result).toEqual({ id: 1, name: 'SPI' });
	});

	it('should map booking provider V2', () => {
		const serviceProvider = ServiceProvider.create('SPI', 1, 'sp1@email.com');
		serviceProvider.id = 1;

		IdHasherMock.encode.mockImplementation((id: number) => String(id));

		const bookingMapper = Container.get(BookingsMapper);
		const result = bookingMapper.mapProviderV2(serviceProvider);
		expect(result).toEqual({ id: '1', name: 'SPI' });
	});

	it('should throw if organisation not loaded', async () => {
		const booking = new Booking();
		const bookingMapper = Container.get(BookingsMapper);
		booking.citizenUinFin = 'S9269634J';

		const testCase = async () => await bookingMapper.maskUinFin(booking);
		await expect(testCase).rejects.toThrow(
			'Booking -> service -> organisation not loaded. BookingsMapper requires it.',
		);
	});

	it('should mask nric, mask all characters except first and last 4 characters', async () => {
		const booking = new Booking();
		const bookingMapper = Container.get(BookingsMapper);
		booking.citizenUinFin = 'S9269634J';
		booking.service = new Service();
		booking.service.organisation = new Organisation();

		UinFinConfigurationMock.canViewPlainUinFin.mockReturnValue(false);

		const result = await bookingMapper.maskUinFin(booking);
		expect(result).toEqual('S****634J');
	});

	it('should not mask nric depending on uinfin configuration ', async () => {
		const booking = new Booking();
		const bookingMapper = Container.get(BookingsMapper);
		booking.citizenUinFin = 'S9269634J';
		booking.service = new Service();
		booking.service.organisation = new Organisation();
		UinFinConfigurationMock.canViewPlainUinFin.mockReturnValue(true);

		const result = await bookingMapper.maskUinFin(booking);
		expect(result).toEqual('S9269634J');
	});

	it('should return mapped dynamic fields (when successful)', async () => {
		DynamicFieldsServiceMock.getServiceFields.mockImplementation(() => Promise.resolve([dynamicFieldEntity]));

		const validator = {
			bypassCaptcha: jest.fn(),
			addCustomCitizenValidations: jest.fn(),
			validate: jest.fn(),
		} as IBookingsValidator;

		const dynamicValueMock = {
			fieldId: 1,
			fieldName: 'testDynamic',
			type: 'SingleSelection' as DynamicValueType,
			singleSelectionKey: 1,
			singleSelectionValue: 'English',
		} as DynamicValueJsonModel;

		DynamicValuesRequestMapperMock.mapDynamicValuesRequest.mockImplementation(() =>
			Promise.resolve({ result: [dynamicValueMock] } as MapRequestOptionalResult),
		);

		const bookingRequest = new BookingDetailsRequest();
		bookingRequest.dynamicValuesUpdated = true;
		bookingRequest.dynamicValues = [{} as PersistDynamicValueContract];

		const mapper = Container.get(BookingsMapper);
		const booking = new Booking();
		await mapper.mapDynamicValuesRequest(bookingRequest, booking, validator);

		expect(DynamicValuesRequestMapperMock.mapDynamicValuesRequest).toBeCalled();
		expect(validator.addCustomCitizenValidations).not.toBeCalled();
		expect(booking.dynamicValues.length).toEqual(1);
	});

	it('should not map dynamic fields (when dynamicValuesUpdated = false)', async () => {
		DynamicFieldsServiceMock.getServiceFields.mockImplementation(() => Promise.resolve([dynamicFieldEntity]));

		const validator = {
			bypassCaptcha: jest.fn(),
			addCustomCitizenValidations: jest.fn(),
			validate: jest.fn(),
		} as IBookingsValidator;

		const dynamicValueMock = {
			fieldId: 1,
			fieldName: 'testDynamic',
			type: 'SingleSelection' as DynamicValueType,
			singleSelectionKey: 1,
			singleSelectionValue: 'English',
		} as DynamicValueJsonModel;

		DynamicValuesRequestMapperMock.mapDynamicValuesRequest.mockImplementation(() =>
			Promise.resolve({ result: [dynamicValueMock] } as MapRequestOptionalResult),
		);

		const bookingRequest = new BookingDetailsRequest();
		bookingRequest.dynamicValuesUpdated = false;
		bookingRequest.dynamicValues = [{} as PersistDynamicValueContract];

		const mapper = Container.get(BookingsMapper);
		const booking = new Booking();
		await mapper.mapDynamicValuesRequest(bookingRequest, booking, validator);

		expect(DynamicValuesRequestMapperMock.mapDynamicValuesRequest).not.toBeCalled();
		expect(validator.addCustomCitizenValidations).not.toBeCalled();
	});

	it('should add dynamic fields validation (when not successful)', async () => {
		DynamicFieldsServiceMock.getServiceFields.mockImplementation(() => Promise.resolve([dynamicFieldEntity]));

		const validator = {
			bypassCaptcha: jest.fn(),
			addCustomCitizenValidations: jest.fn(),
			validate: jest.fn(),
		} as IBookingsValidator;

		const validationError = new BusinessValidation({ code: 'abc', message: 'some validation' });
		DynamicValuesRequestMapperMock.mapDynamicValuesRequest.mockImplementation(() =>
			Promise.resolve({
				errorResult: [validationError],
			} as MapRequestOptionalResult),
		);

		const bookingRequest = new BookingDetailsRequest();
		bookingRequest.dynamicValuesUpdated = true;
		bookingRequest.dynamicValues = [{} as PersistDynamicValueContract];

		const mapper = Container.get(BookingsMapper);
		const booking = new Booking();
		await mapper.mapDynamicValuesRequest(bookingRequest, booking, validator);

		expect(DynamicValuesRequestMapperMock.mapDynamicValuesRequest).toBeCalled();
		expect(validator.addCustomCitizenValidations).toBeCalledWith(validationError);
	});

	it('should return all booking statuses in numbers', () => {
		const mapper = Container.get(BookingsMapper);
		const statuses = mapper.mapStatuses();

		expect(statuses).toEqual(bookingStatusArray.map((value) => value));
	});

	it('should map data to csv', async () => {
		DynamicValuesMapperMock.getValueAsString.mockReturnValue('English');

		const mapper = Container.get(BookingsMapper);
		const booking = getFullBookingInformation();
		const result = await mapper.mapDataCSV(booking);
		expect(result).toStrictEqual({
			'Booking ID': '1',
			'Booking Status': 'Accepted',
			'Booking creation date': booking.createdLog?.timestamp.toString(),
			'Booking service start date/time': booking.startDateTime.toString(),
			'Booking service end date/time': booking.endDateTime.toString(),
			'Booking location': 'somewhere',
			'Booking description': 'description',
			'Booking reference': '123',
			'Dynamic Fields': 'testDynamic:English',
			'Citizen NRIC / FIN number': 'S****567D',
			'Citizen Name': 'armin',
			'Citizen Email address': 'armin@gmail.com',
			'Citizen Phone number': '81101234',
			'Service Name': 'armin service',
			'Service Provider Name': 'armin',
			'Service Provider Email address': 'armin-sp@gmail.com',
			'Service Provider Phone number': '81181188',
		});
	});

	it('should NOT map uuid ', async () => {
		const mapper = Container.get(BookingsMapper);
		const booking = getFullBookingInformation();

		const mapped = await mapper.mapDataModelV1(booking);
		expect(mapped.uuid).toBe(undefined);
	});

	it('should map uuid ', async () => {
		const mapper = Container.get(BookingsMapper);
		const booking = getFullBookingInformation();

		const mapped = await mapper.mapDataModelV1(booking, { mapUUID: true });
		expect(mapped.uuid).toBe('35703724-c99a-4fac-9546-d2b54c50b6fe');
	});

	it('should map booking details', async () => {
		const request: BookingDetailsRequest = new BookingDetailsRequest();
		request.citizenName = 'this should be the name';
		request.citizenEmail = 'correctemail@gmail.com';
		request.citizenPhone = '93328223';
		request.videoConferenceUrl = 'https://localhost';
		const service = new Service();
		service.id = 1;

		const mapper = Container.get(BookingsMapper);
		const booking = Booking.createNew({ creator: userMock });
		await mapper.mapBookingDetails({ request, booking, service });

		expect(booking.citizenName).toEqual('this should be the name');
		expect(booking.citizenEmail).toEqual('correctemail@gmail.com');
		expect(booking.citizenPhone).toEqual('93328223');
		expect(booking.videoConferenceUrl).toEqual('https://localhost');
	});

	it('should map booking details from MyInfo when standalone', async () => {
		const MyInfoResponse: MyInfoResponse = {
			data: {
				name: { value: 'Armin the great' },
				email: { value: 'armin@gmail.com' },
				mobileno: { nbr: { value: '84123456' } },
			},
		};

		UserContextMock.getMyInfo.mockResolvedValue(MyInfoResponse);

		const request: BookingDetailsRequest = new BookingDetailsRequest();
		request.citizenName = 'this should be the name';
		const service = new Service();
		service.id = 1;
		service.isStandAlone = true;

		const mapper = Container.get(BookingsMapper);
		const booking = Booking.createNew({ creator: userMock });
		await mapper.mapBookingDetails({ request, booking, service });

		expect(booking.citizenName).toEqual('Armin the great');
		expect(booking.citizenEmail).toEqual('armin@gmail.com');
		expect(booking.citizenPhone).toEqual('84123456');
	});

	it('should map booking details from MyInfo when standalone (no email/phone override)', async () => {
		const MyInfoResponse: MyInfoResponse = {
			data: {
				name: { value: 'Armin the great' },
				email: { value: 'armin@gmail.com' },
				mobileno: { nbr: { value: '84123456' } },
			},
		};

		UserContextMock.getMyInfo.mockResolvedValue(MyInfoResponse);

		const request: BookingDetailsRequest = new BookingDetailsRequest();
		request.citizenName = 'this should be the name';
		request.citizenEmail = 'correctemail@gmail.com';
		request.citizenPhone = '93328223';
		const service = new Service();
		service.id = 1;
		service.isStandAlone = true;

		const mapper = Container.get(BookingsMapper);
		const booking = Booking.createNew({ creator: userMock });
		await mapper.mapBookingDetails({ request, booking, service });

		expect(booking.citizenName).toEqual('Armin the great');
		expect(booking.citizenEmail).toEqual('correctemail@gmail.com');
		expect(booking.citizenPhone).toEqual('93328223');
	});

	it('should map phone number from OTP auth', async () => {
		const request: BookingDetailsRequest = new BookingDetailsRequest();
		request.citizenPhone = '111111';
		const service = new Service();
		service.id = 1;
		service.isStandAlone = true;

		UserContextMock.getOtpAddOnMobileNo.mockReturnValue('84123456');

		const mapper = Container.get(BookingsMapper);
		const booking = Booking.createNew({ creator: userMock });
		await mapper.mapBookingDetails({ request, booking, service });

		expect(booking.citizenPhone).toEqual('84123456');
	});
});
