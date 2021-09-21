import { Inject, InRequestScope } from 'typescript-ioc';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { Event, OneOffTimeslot, ServiceProvider } from '../../models';
import { ServiceProvidersService } from '../serviceProviders/serviceProviders.service';
import { UserContext } from '../../infrastructure/auth/userContext';
import { OneOffTimeslotRequestV1 } from './oneOffTimeslots.apicontract';
import { OneOffTimeslotsActionAuthVisitor } from './oneOffTimeslots.auth';
import { OneOffTimeslotsMapper } from './oneOffTimeslots.mapper';
import { OneOffTimeslotsValidation } from './oneOffTimeslots.validation';
import { IdHasher } from '../../infrastructure/idHasher';
import { ContainerContext } from '../../infrastructure/containerContext';
import { EventsService } from '../events/events.service';
import { EventsMapper } from '../events/events.mapper';

@InRequestScope
export class OneOffTimeslotsService {
	@Inject
	private eventsService: EventsService;
	@Inject
	private serviceProvidersService: ServiceProvidersService;
	@Inject
	private userContext: UserContext;
	@Inject
	private oneOffTimeslotsMapper: OneOffTimeslotsMapper;
	@Inject
	private eventsMapper: EventsMapper;
	@Inject
	private idHasher: IdHasher;
	@Inject
	private containerContext: ContainerContext;

	private getValidator(): OneOffTimeslotsValidation {
		return this.containerContext.resolve(OneOffTimeslotsValidation);
	}

	private async verifyActionPermission(entity: OneOffTimeslot): Promise<void> {
		const authGroups = await this.userContext.getAuthGroups();
		if (!new OneOffTimeslotsActionAuthVisitor(entity).hasPermission(authGroups)) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_AUTHORIZATION).setMessage(
				`User cannot perform this action for this one off timeslot.`,
			);
		}
	}

	private async loadOneOffTimeslotDependencies(oneOffTimeslot: OneOffTimeslot): Promise<OneOffTimeslot> {
		if (!oneOffTimeslot.serviceProvider && oneOffTimeslot.serviceProviderId) {
			oneOffTimeslot.serviceProvider = await this.serviceProvidersService.getServiceProvider(
				oneOffTimeslot.serviceProviderId,
			);
		}
		return oneOffTimeslot;
	}

	public async save(request: OneOffTimeslotRequestV1): Promise<Event> {
		const validator = this.getValidator();
		await validator.validateOneOffTimeslotsAvailability(request);

		const { serviceProvider } = await this.fetchDependencies(request);
		let oneOffTimeslots = this.oneOffTimeslotsMapper.mapToOneOffTimeslots(
			request,
			new OneOffTimeslot(),
			serviceProvider,
		);
		oneOffTimeslots = this.oneOffTimeslotsMapper.mapDependenciesToOneOffTimeslots(oneOffTimeslots, serviceProvider);
		const event = this.eventsMapper.mapOneOffTimeslotsRequestToEventOneOffTimeslotRequest(request, oneOffTimeslots);
		event.serviceId = this.idHasher.encode(serviceProvider.serviceId);

		await this.verifyActionPermission(oneOffTimeslots);

		return this.eventsService.saveOneOffTimeslot(event);
	}

	public async update(request: OneOffTimeslotRequestV1, idSigned: string): Promise<Event> {
		const id = this.idHasher.decode(idSigned);
		const event = await this.eventsService.getById(id);

		const validator = this.getValidator();
		await validator.validateOneOffTimeslotsAvailability(request, event.oneOffTimeslots[0].id);

		if (!event || !event.oneOffTimeslots[0]) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage(`One off timeslot can't be found`);
		}

		let oneOffTimeslots = this.oneOffTimeslotsMapper.mapToOneOffTimeslots(
			request,
			event.oneOffTimeslots[0],
			await this.serviceProvidersService.getServiceProvider(request.serviceProviderId),
		);
		const { serviceProvider } = await this.fetchDependencies(request);
		oneOffTimeslots = this.oneOffTimeslotsMapper.mapDependenciesToOneOffTimeslots(oneOffTimeslots, serviceProvider);
		const eventRequest = this.eventsMapper.mapOneOffTimeslotsRequestToEventOneOffTimeslotRequest(
			request,
			oneOffTimeslots,
			event,
		);
		eventRequest.serviceId = this.idHasher.encode(serviceProvider.serviceId);

		await this.verifyActionPermission(oneOffTimeslots);

		return this.eventsService.updateOneOffTimeslot(eventRequest, event);
	}

	public async delete(idSigned: string): Promise<void> {
		const id = this.idHasher.decode(idSigned);
		const event = await this.eventsService.getById(id);
		if (!event || !event.oneOffTimeslots[0]) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage(`One off timeslot can't be found`);
		}

		await this.loadOneOffTimeslotDependencies(event.oneOffTimeslots[0]);
		await this.verifyActionPermission(event.oneOffTimeslots[0]);
		await this.eventsService.delete(event);
	}

	private async fetchDependencies(request: OneOffTimeslotRequestV1): Promise<{ serviceProvider: ServiceProvider }> {
		const serviceProvider = await this.serviceProvidersService.getServiceProvider(request.serviceProviderId);
		return { serviceProvider };
	}
}
