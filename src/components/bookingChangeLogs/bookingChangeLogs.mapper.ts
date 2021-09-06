import { Inject, InRequestScope } from 'typescript-ioc';
import { BookingChangeLog, BookingJsonSchemaV1, ChangeLogAction } from '../../models';
import { UserProfileMapper } from '../users/users.mapper';
import {
	BookingChangeLogResponseV1,
	BookingChangeLogResponseV2,
	BookingStateResponseV1,
	BookingStateResponseV2,
	ChangeLogActionContract,
	ChangeLogEntryResponseV1,
	ChangeLogEntryResponseV2,
} from './bookingChangeLogs.apicontract';
import { DynamicValuesMapper } from '../dynamicFields/dynamicValues.mapper';
import * as _ from 'lodash';
import { IdHasher } from '../../infrastructure/idHasher';
import { BookingJsonSchemaV2 } from '../../models/entities/bookingChangeLog';

type GenericState = { [key: string]: any };

@InRequestScope
export class BookingChangeLogsMapper {
	private static _actionMap: Readonly<{ [key: number]: ChangeLogActionContract }>;

	@Inject
	private dynamicValuesMapper: DynamicValuesMapper;

	@Inject
	private idHasher: IdHasher;

	private constructor() {}

	public static initialize() {
		const map: { [key: number]: ChangeLogActionContract } = {};
		map[ChangeLogAction.Create] = ChangeLogActionContract.Create;
		map[ChangeLogAction.Accept] = ChangeLogActionContract.Accept;
		map[ChangeLogAction.Reject] = ChangeLogActionContract.Reject;
		map[ChangeLogAction.Cancel] = ChangeLogActionContract.Cancel;
		map[ChangeLogAction.Update] = ChangeLogActionContract.Update;
		map[ChangeLogAction.Reschedule] = ChangeLogActionContract.Reschedule;
		map[ChangeLogAction.UpdateUser] = ChangeLogActionContract.UpdateUser;

		BookingChangeLogsMapper._actionMap = map;
	}

	private mapChangeLogAction(action: ChangeLogAction): ChangeLogActionContract {
		const value = BookingChangeLogsMapper._actionMap[action];
		if (!value) {
			throw new Error('No mapping found for ChangeLogAction: ' + action);
		}
		return value;
	}

	private mapBookingStateV1(state: BookingJsonSchemaV1): BookingStateResponseV1 {
		const { dynamicValues, ...fields } = state;

		const mappedDynamicValues = this.dynamicValuesMapper.mapDynamicValuesModel(dynamicValues);
		return { ...fields, dynamicValues: mappedDynamicValues };
	}

	private mapBookingStateV2(state: BookingJsonSchemaV2): BookingStateResponseV2 {
		const { dynamicValues, ...fields } = state;

		const mappedDynamicValues = this.dynamicValuesMapper.mapDynamicValuesModel(dynamicValues);
		return { ...fields, dynamicValues: mappedDynamicValues };
	}

	private getChanges<T extends GenericState>(previousState: T, newState: T): T {
		const changes: GenericState = {};
		for (const key of Object.keys(newState)) {
			if (!_.isEqual(newState[key], previousState[key])) {
				changes[key] = newState[key];
			}
		}
		return changes as T;
	}

	public mapChangeLogV1(changeLog: BookingChangeLog): ChangeLogEntryResponseV1 {
		const instance = new ChangeLogEntryResponseV1();
		instance.timestamp = changeLog.timestamp;
		instance.user = UserProfileMapper.mapUserToResponse(changeLog.user);
		instance.action = this.mapChangeLogAction(changeLog.action);
		instance.previousBooking = this.mapBookingStateV1(changeLog.previousState);
		const changes = this.getChanges(changeLog.previousState, changeLog.newState);
		instance.changes = this.mapBookingStateV1(changes);

		return instance;
	}

	public mapChangeLogV2(changeLog: BookingChangeLog): ChangeLogEntryResponseV2 {
		const signedIdPrevState = this.idHasher.encode(changeLog.previousState.id);
		const signedIdNewState = this.idHasher.encode(changeLog.newState.id);
		const signedServiceIdPrevState = this.idHasher.encode(changeLog.previousState.serviceId);
		const signedServiceIdNewState = this.idHasher.encode(changeLog.newState.serviceId);
		const signedServiceProviderIdPrevState = this.idHasher.encode(changeLog.previousState.serviceProviderId);
		const signedServiceProviderIdNewState = this.idHasher.encode(changeLog.newState.serviceProviderId);
		const previousState: BookingJsonSchemaV2 = {
			...changeLog.previousState,
			id: signedIdPrevState,
			serviceId: signedServiceIdPrevState,
			serviceProviderId: signedServiceProviderIdPrevState,
		};
		const newState: BookingJsonSchemaV2 = {
			...changeLog.newState,
			id: signedIdNewState,
			serviceId: signedServiceIdNewState,
			serviceProviderId: signedServiceProviderIdNewState,
		};
		const instance = new ChangeLogEntryResponseV2();
		instance.timestamp = changeLog.timestamp;
		instance.user = UserProfileMapper.mapUserToResponse(changeLog.user);
		instance.action = this.mapChangeLogAction(changeLog.action);
		instance.previousBooking = this.mapBookingStateV2(previousState);
		const changes = this.getChanges(previousState, newState);
		instance.changes = this.mapBookingStateV2(changes);

		return instance;
	}

	public mapDataModelsV1(changeLogs: Map<number, BookingChangeLog[]>): BookingChangeLogResponseV1[] {
		const result: BookingChangeLogResponseV1[] = [];
		for (const [bookingId, logs] of changeLogs.entries()) {
			const bookingEntry = new BookingChangeLogResponseV1();
			bookingEntry.bookingId = bookingId;
			bookingEntry.changeLogs = logs.map((log) => this.mapChangeLogV1(log));
			result.push(bookingEntry);
		}

		return result;
	}

	public mapDataModelsV2(changeLogs: Map<number, BookingChangeLog[]>): BookingChangeLogResponseV2[] {
		const result: BookingChangeLogResponseV2[] = [];
		for (const [bookingId, logs] of changeLogs.entries()) {
			const bookingEntry = new BookingChangeLogResponseV2();
			bookingEntry.bookingId = this.idHasher.encode(bookingId);
			bookingEntry.changeLogs = logs.map((log) => this.mapChangeLogV2(log));
			result.push(bookingEntry);
		}

		return result;
	}
}

BookingChangeLogsMapper.initialize();
