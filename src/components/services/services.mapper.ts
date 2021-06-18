import { Inject } from 'typescript-ioc';
import { Service } from '../../models/entities';
import { LabelsMapper } from '../labels/labels.mapper';
import { LabelsCategoriesMapper } from '../labelsCategories/labelsCategories.mapper';
import { AdditionalSettings, PartialAdditionalSettings, ServiceRequest, ServiceResponse } from './service.apicontract';

export class ServicesMapper {
	@Inject
	private labelsMapper: LabelsMapper;
	@Inject
	private categoriesMapper: LabelsCategoriesMapper;

	public mapToServiceResponse(service: Service) {
		const serviceResponse = new ServiceResponse();
		serviceResponse.id = service.id;
		serviceResponse.name = service.name;
		serviceResponse.isSpAutoAssigned = service.isSpAutoAssigned;
		serviceResponse.noNric = service.noNric;
		serviceResponse.labels = this.labelsMapper.mapToLabelsResponse(service.labels);
		serviceResponse.categories = this.categoriesMapper.mapToCategoriesResponse(service.categories);
		serviceResponse.emailSuffix = service.emailSuffix;
		serviceResponse.videoConferenceUrl = service.videoConferenceUrl;
		serviceResponse.description = service.description;
		serviceResponse.isStandAlone = service.isStandAlone;
		serviceResponse.minDaysInAdvance = service.minDaysInAdvance;
		serviceResponse.maxDaysInAdvance = service.maxDaysInAdvance;

		serviceResponse.additionalSettings = this.mapToSettingsResponse(service);
		return serviceResponse;
	}

	private mapToSettingsResponse(service: Service): AdditionalSettings {
		const additionalSettings = new AdditionalSettings();
		additionalSettings.allowAnonymousBookings = service.allowAnonymousBookings;
		additionalSettings.isOnHold = service.isOnHold;
		additionalSettings.isStandAlone = service.isStandAlone;
		additionalSettings.sendNotifications = service.sendNotifications;
		additionalSettings.sendNotificationsToServiceProviders = service.sendNotificationsToServiceProviders;
		additionalSettings.sendSMSNotifications = service.sendSMSNotifications;
		return additionalSettings;
	}

	public static mapToEntity(service: Service, request: ServiceRequest) {
		// Categories and labels are mapped separately

		service.name = request.name.trim();
		service.setIsSpAutoAssigned(request.isSpAutoAssigned);
		service.setNoNric(request.noNric);
		service.emailSuffix = request.emailSuffix;
		service.videoConferenceUrl = request.videoConferenceUrl;
		service.description = request.description;
		service.minDaysInAdvance = request.minDaysInAdvance === undefined ? null : request.minDaysInAdvance;
		service.maxDaysInAdvance = request.maxDaysInAdvance === undefined ? null : request.maxDaysInAdvance;

		if (request.additionalSettings) {
			this.additionalSettingsMapper(service, request.additionalSettings);
		}
	}

	private static additionalSettingsMapper(service: Service, settings: PartialAdditionalSettings) {
		const {
			allowAnonymousBookings,
			isOnHold,
			isStandAlone,
			sendNotifications,
			sendNotificationsToServiceProviders,
			sendSMSNotifications,
		} = settings;

		if (allowAnonymousBookings !== undefined) {
			service.allowAnonymousBookings = allowAnonymousBookings;
		}
		if (isOnHold !== undefined) {
			service.isOnHold = isOnHold;
		}
		if (isStandAlone !== undefined) {
			service.isStandAlone = isStandAlone;
		}
		if (sendNotifications !== undefined) {
			service.sendNotifications = sendNotifications;
		}
		if (sendNotificationsToServiceProviders !== undefined) {
			service.sendNotificationsToServiceProviders = sendNotificationsToServiceProviders;
		}
		if (sendSMSNotifications !== undefined) {
			service.sendSMSNotifications = sendSMSNotifications;
		}
	}
}
