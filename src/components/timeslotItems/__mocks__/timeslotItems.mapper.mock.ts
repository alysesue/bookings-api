import { TimeslotItem } from '../../../models/entities';
import { TimeslotItemsMapper } from '../timeslotItems.mapper';
import {
	TimeslotItemResponseV1,
	TimeslotItemResponseV2,
	TimeslotsScheduleResponseV1,
	TimeslotsScheduleResponseV2,
} from '../timeslotItems.apicontract';

export class TimeslotItemsMapperMock implements Partial<TimeslotItemsMapper> {
	public static mapToTimeslotsScheduleResponseV1 = jest.fn<TimeslotsScheduleResponseV1, any>();
	public static mapToTimeslotsScheduleResponseV2 = jest.fn<TimeslotsScheduleResponseV2, any>();
	public static mapToTimeslotItemResponseV1 = jest.fn<TimeslotItemResponseV1, any>();
	public static mapToTimeslotItemResponseV2 = jest.fn<TimeslotItemResponseV2, any>();
	public static mapTimeslotItemToEntity = jest.fn<TimeslotItem, any>();

	public mapToTimeslotsScheduleResponseV1(...params): TimeslotsScheduleResponseV1 {
		return TimeslotItemsMapperMock.mapToTimeslotsScheduleResponseV1(...params);
	}

	public mapToTimeslotsScheduleResponseV2(...params): TimeslotsScheduleResponseV2 {
		return TimeslotItemsMapperMock.mapToTimeslotsScheduleResponseV2(...params);
	}

	public mapToTimeslotItemResponseV1(...params): TimeslotItemResponseV1 {
		return TimeslotItemsMapperMock.mapToTimeslotItemResponseV1(...params);
	}

	public mapToTimeslotItemResponseV2(...params): TimeslotItemResponseV2 {
		return TimeslotItemsMapperMock.mapToTimeslotItemResponseV2(...params);
	}

	public mapTimeslotItemToEntity(...params): TimeslotItem {
		return TimeslotItemsMapperMock.mapTimeslotItemToEntity(...params);
	}
}
