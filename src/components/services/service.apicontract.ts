import { LabelRequestModel, LabelResponseModel } from '../labels/label.apicontract';
import {
	LabelCategoryRequestModel,
	LabelCategoryResponseModel,
} from '../labelsCategories/labelsCategories.apicontract';

export class ServiceResponse {
	/**
	 * @isInt
	 */
	public id: number;
	public name: string;
	public isSpAutoAssigned: boolean;
	public noNric: boolean;
	public labels: LabelResponseModel[];
	public categories: LabelCategoryResponseModel[];
	public emailSuffix?: string;
	public videoConferenceUrl?: string;
	public description?: string;
	public additionalSettings: AdditionalSettingsRes;
	/**
	 * @deprecated use additionalSettings.isStandAlone
	 */
	public isStandAlone: boolean;
}

export class ServiceRequest {
	public name: string;
	public isSpAutoAssigned?: boolean;
	public noNric?: boolean;
	/**
	 * @isInt
	 */
	public organisationId?: number;
	public labels?: LabelRequestModel[];
	public categories?: LabelCategoryRequestModel[];
	public emailSuffix?: string | null;
	public videoConferenceUrl?: string | null;
	public description?: string | null;
	public additionalSettings?: AdditionalSettingsReq;
}

export class AdditionalSettingsReq {
	public allowAnonymousBookings?: boolean;
	public isOnHold?: boolean;
	public isStandAlone?: boolean;
	public sendNotifications?: boolean;
	public sendNotificationsToServiceProviders?: boolean;
}

export class AdditionalSettingsRes {
	public allowAnonymousBookings: boolean;
	public isOnHold: boolean;
	public isStandAlone: boolean;
	public sendNotifications: boolean;
	public sendNotificationsToServiceProviders: boolean;
}
