import { OneOffTimeslot } from '../../models';
import { Inject, InRequestScope } from 'typescript-ioc';
import { OneOffTimeslotRequest } from './oneOffTimeslots.apicontract';
import { OneOffTimeslotsRepository } from './oneOffTimeslots.repository';
import { ServiceProvidersService } from '../serviceProviders/serviceProviders.service';
import { UserContext } from '../../infrastructure/auth/userContext';
import { OneOffTimeslotsActionAuthVisitor } from './oneOffTimeslots.auth';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { LabelsService } from '../labels/labels.service';
import { OneOffTimeslotsMapper } from './oneOffTimeslots.mapper';

@InRequestScope
export class OneOffTimeslotsService {
	@Inject
	private oneOffTimeslotsRepo: OneOffTimeslotsRepository;
	@Inject
	private serviceProvidersService: ServiceProvidersService;
	@Inject
	private userContext: UserContext;
	@Inject
	private labelsService: LabelsService;

	private async verifyActionPermission(entity: OneOffTimeslot): Promise<void> {
		const authGroups = await this.userContext.getAuthGroups();
		if (!new OneOffTimeslotsActionAuthVisitor(entity).hasPermission(authGroups)) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_AUTHORIZATION).setMessage(
				`User cannot perform this action for this one off timeslot.`,
			);
		}
	}

	private validate(entity: OneOffTimeslot) {
		const { startDateTime, endDateTime, title, description } = entity;
		if (startDateTime.getTime() >= endDateTime.getTime()) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(`Start time must be less than end time.`);
		}
		if (title && title.length > 100) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(`Title should be max 100 characters`);
		}
		if (description && description.length > 4000) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(`Description should be max 4000 characters`);
		}
	}

	public async save(request: OneOffTimeslotRequest): Promise<OneOffTimeslot> {
		const serviceProvider = await this.serviceProvidersService.getServiceProvider(request.serviceProviderId);
		const labels = await this.labelsService.verifyLabels(request.labelIds, serviceProvider.serviceId);

		const entity = OneOffTimeslotsMapper.mapToOneOffTimeslots(request, serviceProvider, labels);

		this.validate(entity);

		await this.verifyActionPermission(entity);
		await this.oneOffTimeslotsRepo.save(entity);
		return entity;
	}
}
