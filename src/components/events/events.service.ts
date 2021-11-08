import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { Inject, InRequestScope } from 'typescript-ioc';
import { IPagedEntities } from '../../core/pagedEntities';
import { UserContext } from '../../infrastructure/auth/userContext';
import { ContainerContext } from '../../infrastructure/containerContext';
import { IdHasher } from '../../infrastructure/idHasher';
import { Event, Label, OneOffTimeslot, Service } from '../../models';
import { uniqBy } from '../../tools/arrays';
import { LabelsService } from '../labels/labels.service';
import { OneOffTimeslotsRepository } from '../oneOffTimeslots/oneOffTimeslots.repository';
import { ServiceProvidersService } from '../serviceProviders/serviceProviders.service';
import { ServicesService } from '../services/services.service';
import {
	EventFilter,
	EventOneOffTimeslotRequest,
	EventRequest,
	EventTimeslotRequest,
	IEventRequest,
} from './events.apicontract';
import { EventsAuthVisitor } from './events.auth';
import { EventsMapper } from './events.mapper';
import { EventsRepository } from './events.repository';
import { EventsValidation } from './events.validation';

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
		event.isOneOffTimeslot = false;
		const { service, labels } = await this.fetchDependencies(eventRequest);
		event = this.eventsMapper.mapDependenciesToModel(event, { service, labels });

		event.oneOffTimeslots = await this.fetchTimeslotDependencies(eventRequest.timeslots);
		return this.save(event);
	}

	private async save(event: Event): Promise<Event> {
		if (event.title) {
			event.title = event.title.trim();
		}
		event.setDateRange({ ...event.getDateRange() });
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
		let entity = await this.eventsRepository.getById({ id });
		entity.isOneOffTimeslot = false;
		this.eventsMapper.mapUpdateModel(entity, request);
		const { service, labels } = await this.fetchDependencies(request);
		entity.oneOffTimeslots = await this.fetchTimeslotDependencies(request.timeslots);
		entity = this.eventsMapper.mapDependenciesToModel(entity, { service, labels });
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
		const event = await this.eventsRepository.getById({ id });
		if (!event) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage(`Event can't be found`);
		}
		return event;
	}

	public async search(eventFilter: EventFilter): Promise<IPagedEntities<Event>> {
		const eventsPaging = await this.eventsRepository.search({ ...eventFilter, isOneOffTimeslot: false });
		if (eventFilter.title) {
			eventsPaging.entries = eventsPaging.entries.sort((a, b) => {
				if (a.title.toLowerCase().startsWith(eventFilter.title.toLowerCase())) return -1;
				if (b.title.toLowerCase().startsWith(eventFilter.title.toLowerCase())) return 1;
				return 0;
			});
		}

		return eventsPaging;
	}

	private async fetchTimeslotDependencies(timeslots: EventTimeslotRequest[]): Promise<OneOffTimeslot[]> {
		const oneOffTimeslots = [];
		const fKeyServiceProviderId = ({ serviceProviderId }) => serviceProviderId;
		const ids = uniqBy(timeslots, fKeyServiceProviderId).map(fKeyServiceProviderId);
		const idsString = ids.map((id) => this.idHasher.decode(id));
		const serviceProviders = await this.serviceProvidersService.getServiceProviders({
			ids: idsString,
		});

		timeslots.forEach((timeslot) => {
			const { startDateTime, endDateTime, id, serviceProviderId } = timeslot;
			const idNotSigned = this.idHasher.decode(id);
			const serviceProviderIdNotSigned = this.idHasher.decode(serviceProviderId);
			const serviceProvider = serviceProviders.find((sp) => sp.id === serviceProviderIdNotSigned);
			oneOffTimeslots.push(
				OneOffTimeslot.create({ serviceProvider, startDateTime, endDateTime, id: idNotSigned }),
			);
		});
		return oneOffTimeslots;
	}

	private async fetchDependencies(request: IEventRequest): Promise<{ service: Service; labels: Label[] }> {
		const service = await this.servicesService.getService(this.idHasher.decode(request.serviceId), {
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
