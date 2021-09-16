import { Inject, InRequestScope } from 'typescript-ioc';
import {
	EventFilter,
	EventOneOffTimeslotRequest,
	EventRequest,
	EventTimeslotRequest,
	IEventRequest,
} from './events.apicontract';
import { EventsMapper } from './events.mapper';
import { Event } from '../../models';
import { LabelsService } from '../labels/labels.service';
import { ServicesService } from '../services/services.service';
import { Label, OneOffTimeslot, Service } from '../../models';
import { EventsRepository } from './events.repository';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { UserContext } from '../../infrastructure/auth/userContext';
import { EventsAuthVisitor } from './events.auth';
import { EventsValidation } from './events.validation';
import { ContainerContext } from '../../infrastructure/containerContext';
import { IdHasher } from '../../infrastructure/idHasher';
import { OneOffTimeslotsRepository } from '../oneOffTimeslots/oneOffTimeslots.repository';
import { uniqBy } from '../../tools/arrays';
import { ServiceProvidersService } from '../serviceProviders/serviceProviders.service';
import { IPagedEntities } from '../../core/pagedEntities';

@InRequestScope
export class EventsService {
	@Inject
	private eventsMapper: EventsMapper;
	@Inject
	private eventsRepository: EventsRepository;
	@Inject
	private labelsService: LabelsService;
	@Inject
	private servicesService: ServicesService;
	@Inject
	private serviceProvidersService: ServiceProvidersService;
	@Inject
	private oneOffTimeslotsRepository: OneOffTimeslotsRepository;
	@Inject
	private userContext: UserContext;
	@Inject
	private containerContext: ContainerContext;
	@Inject
	private idHasher: IdHasher;

	public async saveOneOffTimeslot(eventRequest: EventOneOffTimeslotRequest): Promise<Event> {
		let event = this.eventsMapper.mapToModel(eventRequest);
		event.oneOffTimeslots = [eventRequest.timeslot];
		const { service, labels } = await this.fetchDependencies(eventRequest);
		event = this.eventsMapper.mapDependenciesToModel(event, { service, labels });
		return this.save(event);
	}

	public async saveEvent(eventRequest: EventRequest): Promise<Event> {
		let event = this.eventsMapper.mapToModel(eventRequest);
		event.oneOffTimeslots = eventRequest.timeslots.map((e) =>
			this.eventsMapper.mapEventTimeslotToOneOffTimeslot(e),
		);
		event.isOneOffTimeslot = false;
		const { service, labels } = await this.fetchDependencies(eventRequest);
		event = this.eventsMapper.mapDependenciesToModel(event, { service, labels });

		event.oneOffTimeslots = await this.fetchTimeslotDependencies(eventRequest);
		return this.save(event);
	}

	private async save(event: Event): Promise<Event> {
		await this.getValidator().validate(event);
		await this.verifyActionPermission(event);
		const eventRes = await this.eventsRepository.save(event);
		return eventRes;
	}

	public async updateOneOffTimeslot(
		eventRequest: EventOneOffTimeslotRequest,
		previousStateEvent: Event,
	): Promise<Event> {
		let event = this.eventsMapper.mapToModel(eventRequest);
		event.oneOffTimeslots = [eventRequest.timeslot];
		event.id = previousStateEvent.id;
		const { service, labels } = await this.fetchDependencies(eventRequest);
		event = this.eventsMapper.mapDependenciesToModel(event, { service, labels });

		return this.save(event);
	}

	public async updateEvent(request: EventRequest, idSigned: string): Promise<Event> {
		const id = this.idHasher.decode(idSigned);
		const entity = await this.eventsRepository.getById({ id });
		entity.isOneOffTimeslot = false;
		this.eventsMapper.mapUpdateModel(entity, request);
		entity.oneOffTimeslots = await this.fetchTimeslotDependencies(request);
		return this.save(entity);
	}

	public async deleteById(id: number) {
		const event = await this.getById(id);
		return await this.delete(event);
	}

	public async delete(event: Event) {
		await this.oneOffTimeslotsRepository.delete(event.oneOffTimeslots);
		await this.eventsRepository.delete(event);
	}

	public async getById(id: number): Promise<Event> {
		const event = this.eventsRepository.getById({ id });
		if (!event) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage(`Event can't be found`);
		}
		return event;
	}

	public async search(eventFilter: EventFilter): Promise<IPagedEntities<Event>> {
		const events = this.eventsRepository.search({ ...eventFilter, isOneOffTimeslot: false });
		return events;
	}

	private async fetchTimeslotDependencies(request: EventRequest): Promise<OneOffTimeslot[]> {
		const oneOffTimeslots = [];
		const fKeyServiceProviderId = ({ serviceProviderId }: EventTimeslotRequest) => serviceProviderId;
		const ids = uniqBy(request.timeslots, fKeyServiceProviderId).map(fKeyServiceProviderId);
		const serviceProviders = await this.serviceProvidersService.getServiceProviders({
			ids,
		});
		request.timeslots.forEach((timeslot) => {
			const { startDateTime, endDateTime, idSigned } = timeslot;
			const id = this.idHasher.decode(idSigned);
			const serviceProvider = serviceProviders.find((sp) => sp.id === timeslot.serviceProviderId);
			oneOffTimeslots.push(OneOffTimeslot.create({ serviceProvider, startDateTime, endDateTime, id }));
		});
		return oneOffTimeslots;
	}

	private async fetchDependencies(request: IEventRequest): Promise<{ service: Service; labels: Label[] }> {
		const service = await this.servicesService.getService(request.serviceId, {
			includeLabelCategories: true,
			includeLabels: true,
		});
		const labels = await this.labelsService.verifyLabels(request.labelIds, service);
		return { service, labels };
	}

	private async verifyActionPermission(event: Event): Promise<void> {
		const authGroups = await this.userContext.getAuthGroups();
		if (!new EventsAuthVisitor(event).hasPermission(authGroups)) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_AUTHORIZATION).setMessage(
				`User cannot perform this event action for this service.`,
			);
		}
	}

	private getValidator(): EventsValidation {
		return this.containerContext.resolve(EventsValidation);
	}
}
