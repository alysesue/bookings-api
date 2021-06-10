import { Inject } from 'typescript-ioc';
import { Service } from '../../models/entities';
import { LabelsMapper } from '../labels/labels.mapper';
import { LabelsCategoriesMapper } from '../labelsCategories/labelsCategories.mapper';
import {AdditionalSettingsRes, ServiceRequest, ServiceResponse} from './service.apicontract';

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
		serviceResponse.additionalSettings = {} as AdditionalSettingsRes;
		serviceResponse.additionalSettings.allowAnonymousBookings = service.allowAnonymousBookings;
		serviceResponse.additionalSettings.isOnHold = service.isOnHold;
		serviceResponse.additionalSettings.isStandAlone = service.isStandAlone;
		serviceResponse.additionalSettings.sendNotifications = service.sendNotifications;
		serviceResponse.additionalSettings.sendNotificationsToServiceProviders = service.sendNotificationsToServiceProviders;
		return serviceResponse;
	}

	public static mapFromServiceRequest(service: Service, request: ServiceRequest) {
		service.name = request.name;
		service.isSpAutoAssigned = request.isSpAutoAssigned || false;
		service.emailSuffix = request.emailSuffix;
		service.noNric = request.noNric || false;
		service.videoConferenceUrl = request.videoConferenceUrl;
		if (request.additionalSettings) {
			service.allowAnonymousBookings = request.additionalSettings.allowAnonymousBookings;
			service.isOnHold = request.additionalSettings.isOnHold;
			service.isStandAlone = request.additionalSettings.isStandAlone;
			service.sendNotifications = request.additionalSettings.sendNotifications;
			service.sendNotificationsToServiceProviders =
				request.additionalSettings.sendNotificationsToServiceProviders;
		}
		return service;
	}
}
