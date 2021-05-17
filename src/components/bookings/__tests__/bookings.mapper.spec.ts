import {
	Booking,
	BusinessValidation,
	Organisation,
	SelectListDynamicField,
	SelectListOption,
	Service,
	User,
} from '../../../models';
import { BookingsMapper } from '../bookings.mapper';
import { UinFinConfiguration } from '../../../models/uinFinConfiguration';
import { DynamicValueJsonModel, DynamicValueType } from '../../../models/entities/booking';
import { Container } from 'typescript-ioc';
import { IdHasher } from '../../../infrastructure/idHasher';
import { IdHasherMock } from '../../../components/labels/__mocks__/labels.mapper.mock';
import { PersistDynamicValueContract } from '../../../components/dynamicFields/dynamicValues.apicontract';
import { BookingDetailsRequest } from '../bookings.apicontract';
import { DynamicFieldsServiceMock } from '../../../components/dynamicFields/__mocks__/dynamicFields.service.mock';
import { bookingStatusArray } from '../../../models/bookingStatus';
import { IBookingsValidator } from '../validator/bookings.validation';
import { DynamicValuesMapper, MapRequestOptionalResult } from '../../../components/dynamicFields/dynamicValues.mapper';

jest.mock('../../../models/uinFinConfiguration');
jest.mock('../../../components/dynamicFields/dynamicValues.mapper');

beforeAll(() => {
	Container.bind(IdHasher).to(IdHasherMock);
	Container.bind(DynamicValuesMapper).to(DynamicValuesMapperMock);
});

describe('Bookings mapper tests', () => {
	DynamicValuesMapper;

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

	const listOptions = {
		key: 1,
		value: 'English',
	} as SelectListOption;
	const dynamicFieldEntity = SelectListDynamicField.create(1, 'testDynamic', [listOptions], 1);

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
		DynamicFieldsServiceMock.mockGetServiceFields.mockImplementation(() => Promise.resolve([dynamicFieldEntity]));

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

		DynamicValuesMapperMock.mapDynamicValuesRequest.mockImplementation(() =>
			Promise.resolve({ result: [dynamicValueMock] } as MapRequestOptionalResult),
		);

		const bookingRequest = new BookingDetailsRequest();
		bookingRequest.dynamicValuesUpdated = true;
		bookingRequest.dynamicValues = [{} as PersistDynamicValueContract];

		const mapper = Container.get(BookingsMapper);
		const booking = new Booking();
		await mapper.mapDynamicValuesRequest(bookingRequest, booking, validator);

		expect(DynamicValuesMapperMock.mapDynamicValuesRequest).toBeCalled();
		expect(validator.addCustomCitizenValidations).not.toBeCalled();
		expect(booking.dynamicValues.length).toEqual(1);
	});

	it('should not map dynamic fields (when dynamicValuesUpdated = false)', async () => {
		DynamicFieldsServiceMock.mockGetServiceFields.mockImplementation(() => Promise.resolve([dynamicFieldEntity]));

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

		DynamicValuesMapperMock.mapDynamicValuesRequest.mockImplementation(() =>
			Promise.resolve({ result: [dynamicValueMock] } as MapRequestOptionalResult),
		);

		const bookingRequest = new BookingDetailsRequest();
		bookingRequest.dynamicValuesUpdated = false;
		bookingRequest.dynamicValues = [{} as PersistDynamicValueContract];

		const mapper = Container.get(BookingsMapper);
		const booking = new Booking();
		await mapper.mapDynamicValuesRequest(bookingRequest, booking, validator);

		expect(DynamicValuesMapperMock.mapDynamicValuesRequest).not.toBeCalled();
		expect(validator.addCustomCitizenValidations).not.toBeCalled();
	});

	it('should add dynamic fields validation (when not successful)', async () => {
		DynamicFieldsServiceMock.mockGetServiceFields.mockImplementation(() => Promise.resolve([dynamicFieldEntity]));

		const validator = {
			bypassCaptcha: jest.fn(),
			addCustomCitizenValidations: jest.fn(),
			validate: jest.fn(),
		} as IBookingsValidator;

		const validationError = new BusinessValidation({ code: 'abc', message: 'some validation' });
		DynamicValuesMapperMock.mapDynamicValuesRequest.mockImplementation(() =>
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

		expect(DynamicValuesMapperMock.mapDynamicValuesRequest).toBeCalled();
		expect(validator.addCustomCitizenValidations).toBeCalledWith(validationError);
	});

	it('should return all booking statuses in numbers', async () => {
		const mapper = Container.get(BookingsMapper);
		const statuses = mapper.mapStatuses();

		expect(statuses).toEqual(bookingStatusArray.map((value) => value));
	});
});

class UinFinConfigurationMock implements Partial<UinFinConfiguration> {
	public static canViewPlainUinFin = jest.fn<boolean, any>();
	public canViewPlainUinFin(...params): any {
		return UinFinConfigurationMock.canViewPlainUinFin(...params);
	}
}

class DynamicValuesMapperMock implements Partial<DynamicValuesMapper> {
	public static mapDynamicValuesRequest = jest.fn<Promise<MapRequestOptionalResult>, any>();

	public async mapDynamicValuesRequest(...params): Promise<MapRequestOptionalResult> {
		return await DynamicValuesMapperMock.mapDynamicValuesRequest(...params);
	}
}
