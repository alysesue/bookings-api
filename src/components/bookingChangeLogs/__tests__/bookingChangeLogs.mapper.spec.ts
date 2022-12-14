import { Container } from 'typescript-ioc';
import { BookingChangeLog, ChangeLogAction, ServiceProvider, User } from '../../../models';
import { IdHasher } from '../../../infrastructure/idHasher';
import { IdHasherMock } from '../../../infrastructure/__mocks__/idHasher.mock';
import { DynamicValueJsonModel, DynamicValueType } from '../../../models/entities/jsonModels';
import {
	DynamicValueContract,
	DynamicValueTypeContract,
} from '../../../components/dynamicFields/dynamicValues.apicontract';
import { BookingChangeLogsMapper } from '../bookingChangeLogs.mapper';
import { BookingBuilder } from '../../../models/entities/booking';

describe('BookingChangeLog mapper tests', () => {
	beforeAll(() => {
		Container.bind(IdHasher).to(IdHasherMock);
	});

	beforeEach(() => {
		jest.resetAllMocks();

		IdHasherMock.encode.mockImplementation((id: number) => id.toString());
		IdHasherMock.decode.mockImplementation((id: string) => Number.parseInt(id, 10));
	});

	const adminMock = User.createAdminUser({
		molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
		userName: 'UserName',
		email: 'test@email.com',
		name: 'Name',
		agencyUserId: 'ABC123',
	});

	const booking = new BookingBuilder()
		.withServiceId(1)
		.withStartDateTime(new Date(Date.UTC(2020, 0, 1, 14, 0)))
		.withEndDateTime(new Date(Date.UTC(2020, 0, 1, 15, 0)))
		.build();
	booking.id = 1;
	booking.serviceProvider = ServiceProvider.create('name', 1, 'ad@as.com', '800 120 7163');

	it('should map ChangeLog with dynamic fields V1', async () => {
		const log = BookingChangeLog.create({
			booking,
			user: adminMock,
			action: ChangeLogAction.Create,
			previousState: {
				id: 123,
				citizenName: 'a',
				citizenEmail: 'b@email.com',
				serviceId: 1,
				serviceProviderId: 8,
				dynamicValues: [
					{
						fieldId: 1,
						fieldName: 'new',
						type: DynamicValueType.Text,
						textValue: 'some text',
					} as DynamicValueJsonModel,
					{
						fieldId: 2,
						fieldName: 'another',
						type: DynamicValueType.Text,
						textValue: 'another value',
					} as DynamicValueJsonModel,
				],
			},
			newState: {
				id: 123,
				citizenName: 'a',
				citizenEmail: 'b@email.com',
				serviceId: 1,
				serviceProviderId: 8,
				dynamicValues: [
					{
						fieldId: 1,
						fieldName: 'new',
						type: DynamicValueType.Text,
						textValue: 'some text',
					} as DynamicValueJsonModel,
					{
						fieldId: 2,
						fieldName: 'another',
						type: DynamicValueType.Text,
						textValue: 'changed value',
					} as DynamicValueJsonModel,
				],
			},
		});
		log.timestamp = new Date(Date.UTC(2020, 0, 1, 14, 0));

		const mapper = Container.get(BookingChangeLogsMapper);
		const result = mapper.mapChangeLogV1(log);
		expect(result.previousBooking).toEqual({
			schemaVersion: 1,
			id: 123,
			citizenName: 'a',
			citizenEmail: 'b@email.com',
			serviceId: 1,
			serviceProviderId: 8,
			dynamicValues: [
				{
					fieldIdSigned: '1',
					fieldName: 'new',
					type: DynamicValueTypeContract.Text,
					textValue: 'some text',
				} as DynamicValueContract,
				{
					fieldIdSigned: '2',
					fieldName: 'another',
					type: DynamicValueTypeContract.Text,
					textValue: 'another value',
				} as DynamicValueContract,
			],
		});
		expect(result.changes).toEqual({
			dynamicValues: [
				{
					fieldIdSigned: '1',
					fieldName: 'new',
					type: DynamicValueTypeContract.Text,
					textValue: 'some text',
				} as DynamicValueContract,
				{
					fieldIdSigned: '2',
					fieldName: 'another',
					type: DynamicValueTypeContract.Text,
					textValue: 'changed value',
				} as DynamicValueContract,
			],
		});
	});

	it('should map ChangeLog with dynamic fields V2', async () => {
		const log = BookingChangeLog.create({
			booking,
			user: adminMock,
			action: ChangeLogAction.Create,
			previousState: {
				id: 123,
				citizenName: 'a',
				citizenEmail: 'b@email.com',
				serviceId: 1,
				serviceProviderId: 8,
				dynamicValues: [
					{
						fieldId: 1,
						fieldName: 'new',
						type: DynamicValueType.Text,
						textValue: 'some text',
					} as DynamicValueJsonModel,
					{
						fieldId: 2,
						fieldName: 'another',
						type: DynamicValueType.Text,
						textValue: 'another value',
					} as DynamicValueJsonModel,
				],
			},
			newState: {
				id: 123,
				citizenName: 'a',
				citizenEmail: 'b@email.com',
				serviceId: 1,
				serviceProviderId: 8,
				dynamicValues: [
					{
						fieldId: 1,
						fieldName: 'new',
						type: DynamicValueType.Text,
						textValue: 'some text',
					} as DynamicValueJsonModel,
					{
						fieldId: 2,
						fieldName: 'another',
						type: DynamicValueType.Text,
						textValue: 'changed value',
					} as DynamicValueJsonModel,
				],
			},
		});
		log.timestamp = new Date(Date.UTC(2020, 0, 1, 14, 0));

		const mapper = Container.get(BookingChangeLogsMapper);
		const result = mapper.mapChangeLogV2(log);
		expect(result.previousBooking).toEqual({
			schemaVersion: 1,
			id: '123',
			citizenName: 'a',
			citizenEmail: 'b@email.com',
			serviceId: '1',
			serviceProviderId: '8',
			dynamicValues: [
				{
					fieldIdSigned: '1',
					fieldName: 'new',
					type: DynamicValueTypeContract.Text,
					textValue: 'some text',
				} as DynamicValueContract,
				{
					fieldIdSigned: '2',
					fieldName: 'another',
					type: DynamicValueTypeContract.Text,
					textValue: 'another value',
				} as DynamicValueContract,
			],
		});
		expect(result.changes).toEqual({
			dynamicValues: [
				{
					fieldIdSigned: '1',
					fieldName: 'new',
					type: DynamicValueTypeContract.Text,
					textValue: 'some text',
				} as DynamicValueContract,
				{
					fieldIdSigned: '2',
					fieldName: 'another',
					type: DynamicValueTypeContract.Text,
					textValue: 'changed value',
				} as DynamicValueContract,
			],
		});
	});

	it('(2) should map ChangeLog with dynamic fields - when not modified V1', async () => {
		const log = BookingChangeLog.create({
			booking,
			user: adminMock,
			action: ChangeLogAction.Create,
			previousState: {
				id: 123,
				citizenName: 'a',
				citizenEmail: 'b@email.com',
				serviceId: 1,
				serviceProviderId: 8,
				dynamicValues: [
					{
						fieldId: 1,
						fieldName: 'new',
						type: DynamicValueType.Text,
						textValue: 'some text',
					} as DynamicValueJsonModel,
					{
						fieldId: 2,
						fieldName: 'another',
						type: DynamicValueType.Text,
						textValue: 'another value',
					} as DynamicValueJsonModel,
				],
			},
			newState: {
				id: 123,
				citizenName: 'b',
				citizenEmail: 'b@email.com',
				serviceId: 1,
				serviceProviderId: 8,
				dynamicValues: [
					{
						fieldId: 1,
						fieldName: 'new',
						type: DynamicValueType.Text,
						textValue: 'some text',
					} as DynamicValueJsonModel,
					{
						fieldId: 2,
						fieldName: 'another',
						type: DynamicValueType.Text,
						textValue: 'another value',
					} as DynamicValueJsonModel,
				],
			},
		});
		log.timestamp = new Date(Date.UTC(2020, 0, 1, 14, 0));

		const mapper = Container.get(BookingChangeLogsMapper);
		const result = mapper.mapChangeLogV1(log);
		expect(result.previousBooking).toEqual({
			schemaVersion: 1,
			id: 123,
			serviceId: 1,
			serviceProviderId: 8,
			citizenName: 'a',
			citizenEmail: 'b@email.com',
			dynamicValues: [
				{
					fieldIdSigned: '1',
					fieldName: 'new',
					type: DynamicValueTypeContract.Text,
					textValue: 'some text',
				} as DynamicValueContract,
				{
					fieldIdSigned: '2',
					fieldName: 'another',
					type: DynamicValueTypeContract.Text,
					textValue: 'another value',
				} as DynamicValueContract,
			],
		});
		expect(result.changes).toEqual({
			citizenName: 'b',
		});
	});

	it('(2) should map ChangeLog with dynamic fields - when not modified V2', async () => {
		const log = BookingChangeLog.create({
			booking,
			user: adminMock,
			action: ChangeLogAction.Create,
			previousState: {
				id: 123,
				citizenName: 'a',
				citizenEmail: 'b@email.com',
				serviceId: 1,
				serviceProviderId: 8,
				dynamicValues: [
					{
						fieldId: 1,
						fieldName: 'new',
						type: DynamicValueType.Text,
						textValue: 'some text',
					} as DynamicValueJsonModel,
					{
						fieldId: 2,
						fieldName: 'another',
						type: DynamicValueType.Text,
						textValue: 'another value',
					} as DynamicValueJsonModel,
				],
			},
			newState: {
				id: 123,
				citizenName: 'b',
				citizenEmail: 'b@email.com',
				serviceId: 1,
				serviceProviderId: 8,
				dynamicValues: [
					{
						fieldId: 1,
						fieldName: 'new',
						type: DynamicValueType.Text,
						textValue: 'some text',
					} as DynamicValueJsonModel,
					{
						fieldId: 2,
						fieldName: 'another',
						type: DynamicValueType.Text,
						textValue: 'another value',
					} as DynamicValueJsonModel,
				],
			},
		});
		log.timestamp = new Date(Date.UTC(2020, 0, 1, 14, 0));

		const mapper = Container.get(BookingChangeLogsMapper);
		const result = mapper.mapChangeLogV2(log);
		expect(result.previousBooking).toEqual({
			schemaVersion: 1,
			id: '123',
			serviceId: '1',
			serviceProviderId: '8',
			citizenName: 'a',
			citizenEmail: 'b@email.com',
			dynamicValues: [
				{
					fieldIdSigned: '1',
					fieldName: 'new',
					type: DynamicValueTypeContract.Text,
					textValue: 'some text',
				} as DynamicValueContract,
				{
					fieldIdSigned: '2',
					fieldName: 'another',
					type: DynamicValueTypeContract.Text,
					textValue: 'another value',
				} as DynamicValueContract,
			],
		});
		expect(result.changes).toEqual({
			citizenName: 'b',
		});
	});
});
