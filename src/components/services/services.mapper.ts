import { Inject } from 'typescript-ioc';
import { Service } from '../../models/entities';
import { LabelsMapper } from '../labels/labels.mapper';
import { LabelsCategoriesMapper } from '../labelsCategories/labelsCategories.mapper';
import { AdditionalSettingsRes, ServiceRequest, ServiceResponse } from './service.apicontract';

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
		serviceResponse.additionalSettings = {} as AdditionalSettingsRes;
		serviceResponse.additionalSettings.allowAnonymousBookings = service.allowAnonymousBookings;
		serviceResponse.additionalSettings.isOnHold = service.isOnHold;
		serviceResponse.additionalSettings.isStandAlone = service.isStandAlone;
		serviceResponse.additionalSettings.sendNotifications = service.sendNotifications;
		serviceResponse.additionalSettings.sendNotificationsToServiceProviders =
			service.sendNotificationsToServiceProviders;
		return serviceResponse;
	}

	public static mapFromServicePutRequest(service: Service, request: ServiceRequest) {
		// Categories and labels are mapped separately
		service.name = request.name.trim();
		service.isSpAutoAssigned = request.isSpAutoAssigned || false;
		service.noNric = request.noNric || false;
		service.emailSuffix = request.emailSuffix;
		service.videoConferenceUrl = request.videoConferenceUrl;
		service.description = request.description;
		if (request.additionalSettings) {
			const {
				allowAnonymousBookings,
				isOnHold,
				isStandAlone,
				sendNotifications,
				sendNotificationsToServiceProviders,
			} = request.additionalSettings;

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
		}
	}
}
