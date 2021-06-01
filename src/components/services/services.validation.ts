import { Inject, Scope, Scoped } from 'typescript-ioc';
import { BusinessValidation } from '../../models';
import { Service } from '../../models/entities';
import { Validator } from '../../infrastructure/validator';
import { concatIteratables } from '../../tools/asyncIterables';
import { verifyUrl } from '../../tools/url';
import { ServicesRepository } from './services.repository';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';

@Scoped(Scope.Local)
export class ServicesValidation extends Validator<Service> {
	@Inject
	private servicesRepository: ServicesRepository;

	protected async *getValidations(service: Service): AsyncIterable<BusinessValidation> {
		const { name, videoConferenceUrl } = service;
		const allValidates = concatIteratables(
			ServicesValidation.validateName(name),
			ServicesValidation.validateVideoConferenceUrl(videoConferenceUrl),
			ServicesValidation.validateVideoConferenceUrlLength(videoConferenceUrl),
		);
		for await (const validation of allValidates) {
			yield validation;
		}
	}

	private static async *validateName(name: string): AsyncIterable<BusinessValidation> {
		if (!name) {
			yield ServiceBusinessValidation.ServiceWithoutName;
		}
	}

	private static async *validateVideoConferenceUrl(videoConferenceUrl: string): AsyncIterable<BusinessValidation> {
		if (videoConferenceUrl) {
			try {
				verifyUrl(videoConferenceUrl);
			} catch (e) {
				yield ServiceBusinessValidation.VideoConferenceInvalidUrl;
			}
		}
	}

	private static async *validateVideoConferenceUrlLength(
		videoConferenceUrl: string,
	): AsyncIterable<BusinessValidation> {
		if (videoConferenceUrl && videoConferenceUrl.length > 2000) {
			yield ServiceBusinessValidation.VideoConferenceInvalidUrlLength;
		}
	}

	public async validateService(isOptional: boolean, serviceId?: number): Promise<any> {
		if (serviceId !== undefined) {
			const service = await this.servicesRepository.getService({
				id: serviceId,
				includeScheduleForm: false,
				includeTimeslotsSchedule: false,
			});

			return this.validateServiceFound(service);
		} else if (!isOptional) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('no service id provided');
		}
	}

	public async validateServiceFound(service: Service): Promise<any> {
		if (!service) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Service not found');
		}
	}
}

class ServiceBusinessValidation {
	private constructor() {}

	public static readonly ServiceWithoutName = new BusinessValidation({
		code: '10300',
		message: `Service name is empty`,
	});

	public static readonly VideoConferenceInvalidUrl = new BusinessValidation({
		code: '10301',
		message: `Invalid URL`,
	});

	public static readonly VideoConferenceInvalidUrlLength = new BusinessValidation({
		code: '10302',
		message: `Invalid URL length`,
	});
}
