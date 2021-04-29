import { Inject, InRequestScope } from 'typescript-ioc';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { OneOffTimeslot } from '../../models';
import { ServiceProvidersService } from '../serviceProviders/serviceProviders.service';
import { UserContext } from '../../infrastructure/auth/userContext';
import { LabelsService } from '../labels/labels.service';
import { OneOffTimeslotRequest } from './oneOffTimeslots.apicontract';
import { OneOffTimeslotsRepository } from './oneOffTimeslots.repository';
import { OneOffTimeslotsActionAuthVisitor } from './oneOffTimeslots.auth';
import { OneOffTimeslotsMapper } from './oneOffTimeslots.mapper';
import { OneOffTimeslotsValidation } from './oneOffTimeslots.validation';
import { IdHasher } from '../../infrastructure/idHasher';

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
	@Inject
	private oneOffTimeslotsValidation: OneOffTimeslotsValidation;
	@Inject
	private mapper: OneOffTimeslotsMapper;
	@Inject
	private idHasher: IdHasher;

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

	public async save(request: OneOffTimeslotRequest): Promise<OneOffTimeslot> {
		const serviceProvider = await this.serviceProvidersService.getServiceProvider(request.serviceProviderId);
		const labels = await this.labelsService.verifyLabels(request.labelIds, serviceProvider.serviceId);
		const entity = this.mapper.mapToOneOffTimeslots(request, serviceProvider, labels);

		const searchRequest = {
			serviceProviderIds: [request.serviceProviderId],
			startDateTime: request.startDateTime,
			endDateTime: request.endDateTime,
		};
		const slotAvailableArr = await this.oneOffTimeslotsRepo.search(searchRequest);
		if (slotAvailableArr.length){
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(`Slot cannot be created as it overlaps with an existing slot.`);
		}

		await this.oneOffTimeslotsValidation.validate(entity);
		await this.verifyActionPermission(entity);
		await this.oneOffTimeslotsRepo.save(entity);
		return entity;
	}

	public async update(request: OneOffTimeslotRequest, idSigned: string): Promise<OneOffTimeslot> {
		const id = this.idHasher.decode(idSigned);
		const entity = await this.oneOffTimeslotsRepo.getById({ id });
		if (!entity) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage(`One off timeslot can't be found`);
		}
		const serviceProvider = await this.serviceProvidersService.getServiceProvider(request.serviceProviderId);
		const labels = await this.labelsService.verifyLabels(request.labelIds, serviceProvider.serviceId);
		this.mapper.updateMapToOneOffTimeslots(request, entity, serviceProvider, labels);

		await this.oneOffTimeslotsValidation.validate(entity);
		await this.verifyActionPermission(entity);
		await this.oneOffTimeslotsRepo.save(entity);
		return entity;
	}

	public async delete(idSigned: string): Promise<void> {
		const id = this.idHasher.decode(idSigned);
		const entity = await this.oneOffTimeslotsRepo.getById({ id });
		if (!entity) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage(`One off timeslot not found`);
		}
		await this.loadOneOffTimeslotDependencies(entity);
		await this.verifyActionPermission(entity);
		await this.oneOffTimeslotsRepo.delete(entity);
	}
}
