import { Inject, InRequestScope } from 'typescript-ioc';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { DeleteResult } from 'typeorm';
import { TimeslotsScheduleRepository } from '../timeslotsSchedules/timeslotsSchedule.repository';
import { TimeOfDay, TimeslotItem, TimeslotsSchedule } from '../../models';
import { UserContext } from '../../infrastructure/auth/userContext';
import { ServicesRepository } from '../services/services.repository';
import { TimeslotItemRequest } from './timeslotItems.apicontract';
import { TimeslotItemsRepository } from './timeslotItems.repository';
import { TimeslotItemsActionAuthVisitor } from './timeslotItems.auth';
import { TimeslotItemsMapper } from './timeslotItems.mapper';

@InRequestScope
export class TimeslotItemsService {
	@Inject
	private timeslotsScheduleRepository: TimeslotsScheduleRepository;
	@Inject
	private timeslotItemsRepository: TimeslotItemsRepository;
	@Inject
	private servicesRepository: ServicesRepository;
	@Inject
	private userContext: UserContext;
	@Inject
	private timeslotItemsMapper: TimeslotItemsMapper;

	private async verifyActionPermission(timeslotSchedule: TimeslotsSchedule): Promise<void> {
		const authGroups = await this.userContext.getAuthGroups();
		let timeslotScheduleData = timeslotSchedule;
		if (!timeslotSchedule._service && !timeslotSchedule._serviceProvider) {
			timeslotScheduleData = await this.timeslotsScheduleRepository.getTimeslotsScheduleById({
				id: timeslotSchedule._id,
			});
			if (timeslotScheduleData._serviceProvider && !timeslotScheduleData._serviceProvider.service) {
				timeslotScheduleData._serviceProvider.service = await this.servicesRepository.getService({
					id: timeslotScheduleData._serviceProvider.serviceId,
				});
			}
		}
		const hasPermission = new TimeslotItemsActionAuthVisitor(timeslotScheduleData).hasPermission(authGroups);
		if (!hasPermission) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_AUTHORIZATION).setMessage(
				`User cannot perform this timeslot item action for this service.`,
			);
		}
	}

	private mapItemAndValidate(
		timeslotsSchedule: TimeslotsSchedule,
		request: TimeslotItemRequest,
		entity: TimeslotItem,
	): TimeslotItem {
		entity._timeslotsScheduleId = timeslotsSchedule._id;
		try {
			this.timeslotItemsMapper.mapTimeslotItemToEntity(request, entity);
		} catch (err) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage((err as Error).message);
		}

		if (TimeOfDay.compare(entity.startTime, entity.endTime) >= 0) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(
				'Timeslot start time must be less than end time.',
			);
		}

		if (timeslotsSchedule.intersectsAnyExceptThis(entity)) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('Timeslot item overlaps existing entry.');
		}

		return entity;
	}

	public async mapAndSaveTimeslotItem(
		timeslotsSchedule: TimeslotsSchedule,
		request: TimeslotItemRequest,
		entity: TimeslotItem,
	): Promise<TimeslotItem> {
		const item = this.mapItemAndValidate(timeslotsSchedule, request, entity);
		return await this.timeslotItemsRepository.saveTimeslotItem(item);
	}

	public async updateTimeslotItem(
		timeslotsSchedule: TimeslotsSchedule,
		timeslotId: number,
		request: TimeslotItemRequest,
	): Promise<TimeslotItem> {
		const timeslotItem = timeslotsSchedule?.timeslotItems.find((t) => t._id === timeslotId);
		if (!timeslotItem) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Timeslot item not found');
		}

		await this.verifyActionPermission(timeslotsSchedule);
		return this.mapAndSaveTimeslotItem(timeslotsSchedule, request, timeslotItem);
	}

	public async createTimeslotItem(
		timeslotsSchedule: TimeslotsSchedule,
		request: TimeslotItemRequest,
	): Promise<TimeslotItem> {
		await this.verifyActionPermission(timeslotsSchedule);
		return this.mapAndSaveTimeslotItem(timeslotsSchedule, request, new TimeslotItem());
	}

	public async deleteTimeslot(request: { id: number; byPassAuth?: boolean }): Promise<DeleteResult> {
		const timeslotSchedule = await this.getTimeslotsScheduleByTimeslotItemId(request);
		await this.verifyActionPermission(timeslotSchedule);

		return await this.timeslotItemsRepository.deleteTimeslotItem(request.id);
	}

	private async getTimeslotsScheduleByTimeslotItemId(request: {
		id: number;
		byPassAuth?: boolean;
	}): Promise<TimeslotsSchedule> {
		const timeslotItem = await this.timeslotItemsRepository.getTimeslotItem(request);
		return this.timeslotsScheduleRepository.getTimeslotsScheduleById({ id: timeslotItem._timeslotsScheduleId });
	}
}
