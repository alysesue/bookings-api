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
import { PersistDynamicValueContract } from '../../../components/dynamicFields/dynamicValues.apicontract';
import { BookingDetailsRequest } from '../bookings.apicontract';
import { DynamicFieldsServiceMock } from '../../../components/dynamicFields/__mocks__/dynamicFields.service.mock';
import { bookingStatusArray } from '../../../models/bookingStatus';
import { IBookingsValidator } from '../validator/bookings.validation';
import {
	DynamicValuesMapper,
	DynamicValuesRequestMapper,
	MapRequestOptionalResult,
} from '../../../components/dynamicFields/dynamicValues.mapper';
import { UserContext, UserContextSnapshot } from '../../../infrastructure/auth/userContext';
import { UserContextMock } from '../../../infrastructure/auth/__mocks__/userContext';
import { OrganisationAdminAuthGroup } from '../../../infrastructure/auth/authGroup';
import { DynamicValuesRequestMapperMock } from '../../../components/dynamicFields/__mocks__/dynamicValues.mapper.mock';
import { DynamicValuesMapperMock } from '../../../components/dynamicFields/__mocks__/dynamicValues.mapper.mock';

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
		IdHasherMock.encode.mockImplementation((id: number) => id.toString());
		IdHasherMock.decode.mockImplementation((id: string) => Number.parseInt(id, 10));
	});

	const userMock = User.createAdminUser({
		molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
		userName: 'UserName',
		email: 'test@email.com',
		name: 'Name',
	});

	const getOrganisationAdminContext = (organisation: Organisation): UserContextSnapshot => {
		const adminMock = User.createAdminUser({
			molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
			userName: 'UserName',
			email: 'test@email.com',
			name: 'Name',
		});
		const authGroupsMock = [new OrganisationAdminAuthGroup(adminMock, [organisation])];
		return { user: adminMock, authGroups: authGroupsMock };
	};

	const listOptions = {
		key: 1,
		value: 'English',
	} as SelectListOption;
	const dynamicFieldEntity = SelectListDynamicField.create(1, 'testDynamic', [listOptions]);
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

	it('should throw if organisation not loaded', async () => {
		const booking = new Booking();
		const bookingMapper = Container.get(BookingsMapper);
		booking.citizenUinFin = 'S9269634J';

		const testCase = () => bookingMapper.maskUinFin(booking, { user: userMock, authGroups: [] });
		expect(testCase).toThrowErrorMatchingInlineSnapshot(
			'"Booking -> service -> organisation not loaded. BookingsMapper requires it."',
		);
	});

	it('should mask nric, mask all characters except first and last 4 characters', async () => {
		const booking = new Booking();
		const bookingMapper = Container.get(BookingsMapper);
		booking.citizenUinFin = 'S9269634J';
		booking.service = new Service();
		booking.service.organisation = new Organisation();

		UinFinConfigurationMock.canViewPlainUinFin.mockReturnValue(false);

		const result = bookingMapper.maskUinFin(booking, { user: userMock, authGroups: [] });
		expect(result).toEqual('S****634J');
	});

	it('should not mask nric depending on uinfin configuration ', async () => {
		const booking = new Booking();
		const bookingMapper = Container.get(BookingsMapper);
		booking.citizenUinFin = 'S9269634J';
		booking.service = new Service();
		booking.service.organisation = new Organisation();
		UinFinConfigurationMock.canViewPlainUinFin.mockReturnValue(true);

		const result = bookingMapper.maskUinFin(booking, { user: userMock, authGroups: [] });
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

	it('should return all booking statuses in numbers', async () => {
		const mapper = Container.get(BookingsMapper);
		const statuses = mapper.mapStatuses();

		expect(statuses).toEqual(bookingStatusArray.map((value) => value));
	});

	it('should map data to csv', async () => {
		DynamicValuesMapperMock.getValueAsString.mockReturnValue('English');

		const mapper = Container.get(BookingsMapper);
		const result = mapper.mapDataCSV(getFullBookingInformation(), getOrganisationAdminContext(organisation));
		expect(result).toStrictEqual({
			'Booking ID': '1',
			'Booking Status': 'Accepted',
			'Booking creation date': 'Mon Mar 01 2021 00:00:00 GMT+0800 (Singapore Standard Time)',
			'Booking service start date/time': 'Mon Mar 01 2021 00:00:00 GMT+0800 (Singapore Standard Time)',
			'Booking service end date/time': 'Mon Mar 01 2021 00:00:00 GMT+0800 (Singapore Standard Time)',
			'Booking location': 'somewhere',
			'Booking description': 'description',
			'Booking reference': '123',
			'Dynamic Fields': 'testDynamic:English',
			'Citizen FIN number': 'S****567D',
			'Citizen Name': 'armin',
			'Citizen Email address': 'armin@gmail.com',
			'Citizen Phone number': '81101234',
			'Service Name': 'armin service',
			'Service Provider Name': 'armin',
			'Service Provider Email address': 'armin-sp@gmail.com',
			'Service Provider Phone number': '81181188',
		});
	});
});

class UinFinConfigurationMock implements Partial<UinFinConfiguration> {
	public static canViewPlainUinFin = jest.fn<boolean, any>();
	public canViewPlainUinFin(...params): any {
		return UinFinConfigurationMock.canViewPlainUinFin(...params);
	}
}
