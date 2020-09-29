import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { Inject, InRequestScope } from 'typescript-ioc';
import { ScheduleForm, Service, TimeslotItem, TimeslotsSchedule } from '../../models';
import { ServicesRepository } from './services.repository';
import { ServiceRequest, SetScheduleFormRequest } from './service.apicontract';
import { SchedulesFormService } from '../schedulesForm/schedulesForm.service';
import { TimeslotItemRequest } from '../timeslotItems/timeslotItems.apicontract';
import { TimeslotItemsService } from '../timeslotItems/timeslotItems.service';
import { TimeslotsScheduleService } from '../timeslotsSchedules/timeslotsSchedule.service';
import { UserContext } from '../../infrastructure/auth/userContext';
import { OrganisationAdminAuthGroup } from '../../infrastructure/auth/authGroup';

@InRequestScope
export class ServicesService {
	@Inject
	private servicesRepository: ServicesRepository;
	@Inject
	private schedulesFormService: SchedulesFormService;
	@Inject
	private timeslotItemsService: TimeslotItemsService;
	@Inject
	private timeslotsScheduleService: TimeslotsScheduleService;
	@Inject
	private userContext: UserContext;

	public async createService(request: ServiceRequest): Promise<Service> {
		// TODO: implement authorisation in some AuthVisitor. No need to do casting.
		const orgAdmins = (await this.userContext.getAuthGroups()).filter(
			(g) => g instanceof OrganisationAdminAuthGroup,
		) as OrganisationAdminAuthGroup[];

		if (
			orgAdmins.length === 0 ||
			(request.organisationId && !orgAdmins[0].hasOrganisationId(request.organisationId))
		) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_AUTHORIZATION).setMessage(
				'User not authorized to add services.',
			);
		}

		const service = new Service();
		service.name = request.name?.trim();
		if (!service.name) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('Service name is empty');
		}

		if (request.organisationId) {
			service.organisationId = request.organisationId;
		} else {
			service.organisationId = orgAdmins[0].authorisedOrganisations[0].id;
		}

		return await this.servicesRepository.save(service);
	}

	public async updateService(id: number, request: ServiceRequest): Promise<Service> {
		try {
			const service = await this.servicesRepository.getService(id);
			if (!service) throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Service not found');
			service.name = request.name;
			return await this.servicesRepository.save(service);
		} catch (e) {
			if (e.message.startsWith('duplicate key value violates unique constraint'))
				throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('Service name is already present');
			throw e;
		}
	}

	public async setServiceScheduleForm(id: number, model: SetScheduleFormRequest): Promise<ScheduleForm> {
		const service = await this.servicesRepository.getService(id);
		if (!service) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Service not found');
		}

		let scheduleForm: ScheduleForm = null;
		if (model.scheduleFormId) {
			scheduleForm = await this.schedulesFormService.getScheduleForm(model.scheduleFormId);
			if (!scheduleForm) {
				throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('ScheduleForm not found');
			}
		}

		service.scheduleForm = scheduleForm;
		await this.servicesRepository.save(service);
		return scheduleForm;
	}

	public async getServiceScheduleForm(id: number): Promise<ScheduleForm> {
		const service = await this.servicesRepository.getService(id);
		if (!service) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Service not found');
		}

		let scheduleForm: ScheduleForm = null;
		if (service.scheduleFormId) {
			scheduleForm = await this.schedulesFormService.getScheduleForm(service.scheduleFormId);
		}

		if (!scheduleForm) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Service scheduleForm not found');
		}

		return scheduleForm;
	}

	public async getServices(): Promise<Service[]> {
		return await this.servicesRepository.getAll();
	}

	public async getService(id: number): Promise<Service> {
		const service = await this.servicesRepository.getService(id);
		if (!service) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Service not found');
		}
		return service;
	}

	public async getServiceTimeslotsSchedule(id: number): Promise<TimeslotsSchedule> {
		const service = await this.getService(id);
		return await this.timeslotsScheduleService.getTimeslotsScheduleById(service.timeslotsScheduleId);
	}

	public async addTimeslotItem(serviceId: number, request: TimeslotItemRequest): Promise<TimeslotItem> {
		let timeslotsSchedule = await this.getServiceTimeslotsSchedule(serviceId);
		if (!timeslotsSchedule) {
			timeslotsSchedule = await this.createTimeslotsSchedule(serviceId);
		}
		return this.timeslotItemsService.createTimeslotItem(timeslotsSchedule, request);
	}

	public async deleteTimeslotsScheduleItem(timeslotId: number) {
		await this.timeslotItemsService.deleteTimeslot(timeslotId);
	}

	public async updateTimeslotItem({
		serviceId,
		timeslotId,
		request,
	}: {
		serviceId: number;
		timeslotId: number;
		request: TimeslotItemRequest;
	}): Promise<TimeslotItem> {
		const timeslotsSchedule = await this.getServiceTimeslotsSchedule(serviceId);
		return this.timeslotItemsService.updateTimeslotItem(timeslotsSchedule, timeslotId, request);
	}

	private async createTimeslotsSchedule(serviceId: number): Promise<TimeslotsSchedule> {
		const service = await this.servicesRepository.getService(serviceId);
		if (!service) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Service not found');
		}
		service.timeslotsSchedule = TimeslotsSchedule.create(service, undefined);
		await this.servicesRepository.save(service);
		return service.timeslotsSchedule;
	}
}
