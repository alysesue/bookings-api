import { OneOffTimeslot } from '../../models';
import { Inject, InRequestScope } from 'typescript-ioc';
import { OneOffTimeslotRequest } from './oneOffTimeslots.apicontract';
import { OneOffTimeslotsRepository } from './oneOffTimeslots.repository';
import { ServiceProvidersService } from '../serviceProviders/serviceProviders.service';
import { UserContext } from '../../infrastructure/auth/userContext';
import { OneOffTimeslotsActionAuthVisitor } from './oneOffTimeslots.auth';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { LabelsMapper } from '../../components/labels/labels.mapper'
@InRequestScope
export class OneOffTimeslotsService {
	@Inject
	private oneOffTimeslotsRepo: OneOffTimeslotsRepository;
	@Inject
	private serviceProvidersService: ServiceProvidersService;
	@Inject
	private userContext: UserContext;
	@Inject
	private labelMapper: LabelsMapper;

	private async verifyActionPermission(entity: OneOffTimeslot): Promise<void> {
		const authGroups = await this.userContext.getAuthGroups();
		if (!new OneOffTimeslotsActionAuthVisitor(entity).hasPermission(authGroups)) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_AUTHORIZATION).setMessage(
				`User cannot perform this action for this one off timeslot.`,
			);
		}
	}

	private validate(entity: OneOffTimeslot) {
		if (entity.startDateTime.getTime() >= entity.endDateTime.getTime()) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(`Start time must be less than end time.`);
		}
	}

	public async save(request: OneOffTimeslotRequest): Promise<OneOffTimeslot> {
		const serviceProvider = await this.serviceProvidersService.getServiceProvider(request.serviceProviderId);
		const labels = this.labelMapper.mapToLabels(request.labels);
		
		const entity = new OneOffTimeslot();
		entity.serviceProvider = serviceProvider;
		entity.serviceProviderId = serviceProvider.id;
		entity.startDateTime = request.startDateTime;
		entity.endDateTime = request.endDateTime;
		entity.capacity = request.capacity;
		entity.labels = labels;

		this.validate(entity);
		await this.verifyActionPermission(entity);
		await this.oneOffTimeslotsRepo.save(entity);
		return entity;
	}
}
