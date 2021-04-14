import { Booking, Organisation, SelectListDynamicField, SelectListOption, Service, User } from '../../../models';
import { BookingsMapper } from '../bookings.mapper';
import { UinFinConfiguration } from '../../../models/uinFinConfiguration';
import { DynamicValueJsonModel, DynamicValueType } from '../../../models/entities/booking';
import { Container } from 'typescript-ioc';
import { IdHasher } from '../../../infrastructure/idHasher';
import { IdHasherMock } from '../../../components/labels/__tests__/labels.mapper.spec';
import {
	DynamicValueContract,
	DynamicValueTypeContract,
	PersistDynamicValueContract,
} from '../../../components/dynamicFields/dynamicValues.apicontract';
import { BookingDetailsRequest } from '../bookings.apicontract';
import { DynamicFieldsService } from '../../../components/dynamicFields/dynamicFields.service';
import { DynamicFieldsServiceMock } from '../../../components/dynamicFields/__mocks__/dynamicFields.service.mock';

jest.mock('../../../models/uinFinConfiguration');

beforeAll(() => {
	Container.bind(IdHasher).to(IdHasherMock);
	Container.bind(DynamicFieldsService).to(DynamicFieldsServiceMock);
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

	const listOptions = {
		key: 1,
		value: 'English',
	} as SelectListOption;
	const dynamicRepository = SelectListDynamicField.create(1, 'testDynamic', [listOptions], 1);

	const dynamicValues = new PersistDynamicValueContract();
	dynamicValues.SingleSelectionKey = 1;
	dynamicValues.fieldIdSigned = 'mVpRZpPJ';
	dynamicValues.type = 'SingleSelection' as DynamicValueTypeContract;

	it('should throw if organisation not loaded', async () => {
		const booking = new Booking();
		booking.citizenUinFin = 'S9269634J';

		const testCase = () => BookingsMapper.maskUinFin(booking, { user: userMock, authGroups: [] });
		expect(testCase).toThrowErrorMatchingInlineSnapshot(
			'"Booking -> service -> organisation not loaded. BookingsMapper requires it."',
		);
	});

	it('should mask nric, mask all characters except first and last 4 characters', async () => {
		const booking = new Booking();
		booking.citizenUinFin = 'S9269634J';
		booking.service = new Service();
		booking.service.organisation = new Organisation();

		UinFinConfigurationMock.canViewPlainUinFin.mockReturnValue(false);

		const result = BookingsMapper.maskUinFin(booking, { user: userMock, authGroups: [] });
		expect(result).toEqual('S****634J');
	});

	it('should not mask nric depending on uinfin configuration ', async () => {
		const booking = new Booking();
		booking.citizenUinFin = 'S9269634J';
		booking.service = new Service();
		booking.service.organisation = new Organisation();
		UinFinConfigurationMock.canViewPlainUinFin.mockReturnValue(true);

		const result = BookingsMapper.maskUinFin(booking, { user: userMock, authGroups: [] });
		expect(result).toEqual('S9269634J');
	});

	it('should return dynamic fields ', async () => {
		const dynamicValuesJson = {
			fieldId: 1,
			fieldName: 'testname',
			type: 'SingleSelection' as DynamicValueType,
			SingleSelectionKey: 1,
			SingleSelectionValue: 'test',
		} as DynamicValueJsonModel;

		const mapper = Container.get(BookingsMapper);
		const dynamicReturn = mapper.mapDynamicValuesModel([dynamicValuesJson]);

		const dynamicContract = new DynamicValueContract();
		dynamicContract.fieldIdSigned = '1';
		dynamicContract.SingleSelectionKey = 1;
		dynamicContract.SingleSelectionValue = 'test';
		dynamicContract.fieldName = 'testname';
		dynamicContract.type = 'SingleSelection' as DynamicValueTypeContract;

		expect(dynamicReturn).toEqual([dynamicContract]);
	});

	it('should return empty array when no dynamic values are passed ', async () => {
		const mapper = Container.get(BookingsMapper);
		const dynamicReturn = mapper.mapDynamicValuesModel([]);

		expect(dynamicReturn).toEqual([]);
	});

	it('should return matched dynamic fields ', async () => {
		DynamicFieldsServiceMock.mockGetServiceFields.mockImplementation(() => Promise.resolve([dynamicRepository]));
		IdHasherMock.decode.mockImplementation(() => 1);

		const bookingRequest = new BookingDetailsRequest();
		bookingRequest.dynamicValuesUpdated = true;
		bookingRequest.dynamicValues = [dynamicValues];

		const mapper = Container.get(BookingsMapper);
		const booking = new Booking();
		await mapper.mapDynamicValuesRequest(bookingRequest, booking);

		const result = {
			fieldId: 1,
			fieldName: 'testDynamic',
			type: 'SingleSelection' as DynamicValueType,
			SingleSelectionKey: 1,
			SingleSelectionValue: 'English',
		} as DynamicValueJsonModel;
		expect(booking.dynamicValues).toEqual([result]);
	});

	it('should return empty array when no dynamic fields match', async () => {
		DynamicFieldsServiceMock.mockGetServiceFields.mockImplementation(() => Promise.resolve([dynamicRepository]));
		IdHasherMock.decode.mockImplementation(() => 2);

		const bookingRequest = new BookingDetailsRequest();
		bookingRequest.dynamicValuesUpdated = true;
		bookingRequest.dynamicValues = [dynamicValues];

		const mapper = Container.get(BookingsMapper);
		const booking = new Booking();
		await mapper.mapDynamicValuesRequest(bookingRequest, booking);

		expect(booking.dynamicValues).toEqual([]);
	});
});

class UinFinConfigurationMock implements Partial<UinFinConfiguration> {
	public static canViewPlainUinFin = jest.fn<boolean, any>();
	public canViewPlainUinFin(...params): any {
		return UinFinConfigurationMock.canViewPlainUinFin(...params);
	}
}
