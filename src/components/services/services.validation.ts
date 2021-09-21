import { Inject, Scope, Scoped } from 'typescript-ioc';
import { BusinessValidation } from '../../models';
import { Service } from '../../models/entities';
import { Validator } from '../../infrastructure/validator';
import { concatIteratables } from '../../tools/asyncIterables';
import { verifyUrl } from '../../tools/url';
import { ServicesRepository } from './services.repository';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import * as _ from 'lodash';
import { ErrorsRef } from '../../errors/errors.ref';

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
			ServicesValidation.validateDaysInAdvance(service),
		);
		yield* allValidates;
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

	private static async *validateDaysInAdvance({
		minDaysInAdvance,
		maxDaysInAdvance,
	}: {
		minDaysInAdvance?: number;
		maxDaysInAdvance?: number;
	}): AsyncIterable<BusinessValidation> {
		const nilMin = _.isNil(minDaysInAdvance);
		const nilMax = _.isNil(maxDaysInAdvance);
		if (!nilMin && minDaysInAdvance < 0) {
			yield ServiceBusinessValidation.InvalidMinDaysInAdvance;
		}

		if (!nilMax && maxDaysInAdvance < 0) {
			yield ServiceBusinessValidation.InvalidMaxDaysInAdvance;
		}

		if (!nilMax && !nilMax && maxDaysInAdvance <= minDaysInAdvance) {
			yield ServiceBusinessValidation.InvalidMaxMinDaysInAdvance;
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

	public async validateServiceFound(service: Service): Promise<void> {
		if (!service) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Service not found');
		}
	}
}

class ServiceBusinessValidation {
	public static errors = ErrorsRef().service;

	public static readonly ServiceWithoutName = new BusinessValidation(
		ServiceBusinessValidation.errors.ServiceWithoutName,
	);

	public static readonly VideoConferenceInvalidUrl = new BusinessValidation(
		ServiceBusinessValidation.errors.VideoConferenceInvalidUrl,
	);

	public static readonly VideoConferenceInvalidUrlLength = new BusinessValidation(
		ServiceBusinessValidation.errors.VideoConferenceInvalidUrlLength,
	);

	public static readonly InvalidMaxMinDaysInAdvance = new BusinessValidation(
		ServiceBusinessValidation.errors.InvalidMaxMinDaysInAdvance,
	);

	public static readonly InvalidMinDaysInAdvance = new BusinessValidation(
		ServiceBusinessValidation.errors.InvalidMinDaysInAdvance,
	);

	public static readonly InvalidMaxDaysInAdvance = new BusinessValidation(
		ServiceBusinessValidation.errors.InvalidMaxDaysInAdvance,
	);
}
