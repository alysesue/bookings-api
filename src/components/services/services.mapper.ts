import { Inject } from 'typescript-ioc';
import { Service } from '../../models/entities';
import { LabelsMapper } from '../labels/labels.mapper';
import { LabelsCategoriesMapper } from '../labelsCategories/labelsCategories.mapper';
import {
	AdditionalSettings,
	PartialAdditionalSettings,
	ServiceSummaryModel,
	ServiceRequestV1,
	ServiceResponseBase,
	ServiceResponseV1,
	ServiceResponseV2,
} from './service.apicontract';
import { IService } from '../../models/interfaces';
import { IdHasher } from '../../infrastructure/idHasher';
import { CitizenAuthenticationType } from '../../models/citizenAuthenticationType';

export class ServicesMapper {
	@Inject
	private labelsMapper: LabelsMapper;
	@Inject
	private categoriesMapper: LabelsCategoriesMapper;
	@Inject
	private idHasher: IdHasher;

	public mapToServiceResponseV1(service: Service): ServiceResponseV1 {
		const serviceResponse = this.mapToServiceResponseBase(service);
		return { ...serviceResponse, id: service.id };
	}

	public mapToServiceResponseV2(service: Service, includeOrganisationId = false): ServiceResponseV2 {
		const signedServiceId = this.idHasher.encode(service.id);
		const serviceResponse = this.mapToServiceResponseBase(service);
		const signedOrgId = includeOrganisationId ? this.idHasher.encode(service.organisationId) : undefined;
		return { ...serviceResponse, id: signedServiceId, orgId: signedOrgId };
	}

	private mapToServiceResponseBase(service: Service): ServiceResponseBase {
		const serviceResponse = new ServiceResponseBase();
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
		additionalSettings.allowAnonymousBookings = service.hasCitizenAuthentication(CitizenAuthenticationType.Otp);
		additionalSettings.citizenAuthentication = service.citizenAuthentication;
		additionalSettings.isOnHold = service.isOnHold;
		additionalSettings.isStandAlone = service.isStandAlone;
		additionalSettings.sendNotifications = service.sendNotifications;
		additionalSettings.sendNotificationsToServiceProviders = service.sendNotificationsToServiceProviders;
		additionalSettings.sendSMSNotifications = service.sendSMSNotifications;
		additionalSettings.hasSalutations = service.hasSalutation;
		return additionalSettings;
	}

	public mapToEntityV1(service: Service, request: ServiceRequestV1) {
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

	private additionalSettingsMapper(service: Service, settings: PartialAdditionalSettings) {
		const {
			allowAnonymousBookings,
			citizenAuthentication,
			isOnHold,
			isStandAlone,
			sendNotifications,
			sendNotificationsToServiceProviders,
			sendSMSNotifications,
			hasSalutations,
		} = settings;

		if (allowAnonymousBookings !== undefined) {
			if (allowAnonymousBookings && !service.hasCitizenAuthentication(CitizenAuthenticationType.Otp)) {
				service.citizenAuthentication = [
					...(service.citizenAuthentication || []),
					CitizenAuthenticationType.Otp,
				];
			}
			if (!allowAnonymousBookings && service.hasCitizenAuthentication(CitizenAuthenticationType.Otp)) {
				service.citizenAuthentication = service.citizenAuthentication.filter(
					(a) => a !== CitizenAuthenticationType.Otp,
				);
			}
		}
		if (citizenAuthentication !== undefined) {
			service.citizenAuthentication = citizenAuthentication;
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

		if (hasSalutations !== undefined) {
			service.hasSalutation = hasSalutations;
		}
	}

	public modelToServiceSummaryModel(srv: IService) {
		return new ServiceSummaryModel(this.idHasher.encode(srv.id), srv.name);
	}
}
