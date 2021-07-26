import { DeleteResult } from 'typeorm';
import { TimeslotItem, TimeslotsSchedule } from '../../../models/entities';
import { TimeslotItemRequest } from '../timeslotItems.apicontract';
import { TimeslotItemsSearchRequest } from '../timeslotItems.repository';
import { TimeslotItemsService } from '../timeslotItems.service';

export class TimeslotItemsServiceMock implements Partial<TimeslotItemsService> {
	public static mapAndSaveTimeslotItemsToTimeslotsSchedule = jest.fn();
	public static deleteTimeslot = jest.fn();
	public static mapAndSaveTimeslotItem = jest.fn();
	public static createTimeslotItem = jest.fn();
	public static updateTimeslotItem = jest.fn();

	public async mapAndSaveTimeslotItem(
		timeslotsSchedule: TimeslotsSchedule,
		request: TimeslotItemRequest,
		entity: TimeslotItem,
	): Promise<TimeslotItem> {
		return await TimeslotItemsServiceMock.mapAndSaveTimeslotItem(timeslotsSchedule, request, entity);
	}

	public async createTimeslotItem(
		timeslotsSchedule: TimeslotsSchedule,
		request: TimeslotItemRequest,
	): Promise<TimeslotItem> {
		return await TimeslotItemsServiceMock.createTimeslotItem(timeslotsSchedule, request);
	}

	public async deleteTimeslot(request: TimeslotItemsSearchRequest): Promise<DeleteResult> {
		return await TimeslotItemsServiceMock.deleteTimeslot({ id: request.id });
	}

	public async updateTimeslotItem(
		timeslotsSchedule: TimeslotsSchedule,
		timeslotId: number,
		request: TimeslotItemRequest,
	): Promise<TimeslotItem> {
		return await TimeslotItemsServiceMock.updateTimeslotItem(timeslotsSchedule, timeslotId, request);
	}
}
