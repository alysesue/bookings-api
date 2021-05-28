import { Inject, InRequestScope } from 'typescript-ioc';
import { BookingChangeLog, BookingJsonSchemaV1, ChangeLogAction } from '../../models';
import { UserProfileMapper } from '../users/users.mapper';
import {
	BookingChangeLogResponse,
	BookingStateResponse,
	ChangeLogActionContract,
	ChangeLogEntryResponse,
} from './bookingChangeLogs.apicontract';
import { DynamicValuesMapper } from '../dynamicFields/dynamicValues.mapper';
import * as _ from 'lodash';

type GenericState = { [key: string]: any };

@InRequestScope
export class BookingChangeLogsMapper {
	private static _actionMap: Readonly<{ [key: number]: ChangeLogActionContract }>;

	@Inject
	private dynamicValuesMapper: DynamicValuesMapper;

	private constructor() {}

	public static initialize() {
		const map: { [key: number]: ChangeLogActionContract } = {};
		map[ChangeLogAction.Create] = ChangeLogActionContract.Create;
		map[ChangeLogAction.Accept] = ChangeLogActionContract.Accept;
		map[ChangeLogAction.Reject] = ChangeLogActionContract.Reject;
		map[ChangeLogAction.Cancel] = ChangeLogActionContract.Cancel;
		map[ChangeLogAction.Update] = ChangeLogActionContract.Update;
		map[ChangeLogAction.Reschedule] = ChangeLogActionContract.Reschedule;

		BookingChangeLogsMapper._actionMap = map;
	}

	private mapChangeLogAction(action: ChangeLogAction): ChangeLogActionContract {
		const value = BookingChangeLogsMapper._actionMap[action];
		if (!value) {
			throw new Error('No mapping found for ChangeLogAction: ' + action);
		}
		return value;
	}

	private mapBookingState(state: BookingJsonSchemaV1): BookingStateResponse {
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

	public mapChangeLog(changeLog: BookingChangeLog): ChangeLogEntryResponse {
		const instance = new ChangeLogEntryResponse();
		instance.timestamp = changeLog.timestamp;
		instance.user = UserProfileMapper.mapUserToResponse(changeLog.user);
		instance.action = this.mapChangeLogAction(changeLog.action);
		instance.previousBooking = this.mapBookingState(changeLog.previousState);
		const changes = this.getChanges(changeLog.previousState, changeLog.newState);
		instance.changes = this.mapBookingState(changes);

		return instance;
	}

	public mapDataModels(changeLogs: Map<number, BookingChangeLog[]>): BookingChangeLogResponse[] {
		const result: BookingChangeLogResponse[] = [];
		for (const [bookingId, logs] of changeLogs.entries()) {
			const bookingEntry = new BookingChangeLogResponse();
			bookingEntry.bookingId = bookingId;
			bookingEntry.changeLogs = logs.map((log) => this.mapChangeLog(log));
			result.push(bookingEntry);
		}

		return result;
	}
}

BookingChangeLogsMapper.initialize();
