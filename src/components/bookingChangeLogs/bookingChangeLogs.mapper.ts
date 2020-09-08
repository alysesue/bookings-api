import {
	BookingChangeLogResponse,
	BookingStateResponse,
	ChangeLogActionContract,
	ChangeLogEntryResponse,
} from './bookingChangeLogs.apicontract';
import { BookingChangeLog, BookingJsonSchemaV1, ChangeLogAction } from '../../models';
import { UsersMapper } from '../users/users.mapper';

type GenericState = { [key: string]: any };

export class BookingChangeLogsMapper {
	private static _actionMap: { [key: number]: ChangeLogActionContract };

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

	private static mapChangeLogAction(action: ChangeLogAction): ChangeLogActionContract {
		const value = BookingChangeLogsMapper._actionMap[action];
		if (!value) {
			throw new Error('Not mapping found for ChangeLogAction: ' + action);
		}
		return value;
	}

	private static mapBookingState(state: BookingJsonSchemaV1): BookingStateResponse {
		return { ...state };
	}

	private static getChanges<T extends GenericState>(previousState: T, newState: T): T {
		const changes: GenericState = {};
		for (const key of Object.keys(newState)) {
			if (newState[key] !== previousState[key]) {
				changes[key] = newState[key];
			}
		}
		return changes as T;
	}

	public static mapChangeLog(changeLog: BookingChangeLog): ChangeLogEntryResponse {
		const instance = new ChangeLogEntryResponse();
		instance.timestamp = changeLog.timestamp;
		instance.user = UsersMapper.mapToResponse(changeLog.user);
		instance.action = BookingChangeLogsMapper.mapChangeLogAction(changeLog.action);
		instance.previousBooking = BookingChangeLogsMapper.mapBookingState(changeLog.previousState);
		const changes = BookingChangeLogsMapper.getChanges(changeLog.previousState, changeLog.newState);
		instance.changes = BookingChangeLogsMapper.mapBookingState(changes);

		return instance;
	}

	public static mapDataModels(changeLogs: Map<number, BookingChangeLog[]>): BookingChangeLogResponse[] {
		const result: BookingChangeLogResponse[] = [];
		for (const [bookingId, logs] of changeLogs.entries()) {
			const bookingEntry = new BookingChangeLogResponse();
			bookingEntry.bookingId = bookingId;
			bookingEntry.changeLogs = logs.map((log) => BookingChangeLogsMapper.mapChangeLog(log));
			result.push(bookingEntry);
		}

		return result;
	}
}

BookingChangeLogsMapper.initialize();
