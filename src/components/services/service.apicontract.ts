import { LabelRequestModel, LabelResponseModel } from '../labels/label.apicontract';
import {
	LabelCategoryRequestModel,
	LabelCategoryResponseModel,
} from '../labelsCategories/labelsCategories.apicontract';

export class ServiceResponseBase {
	public name: string;
	public isSpAutoAssigned: boolean;
	public noNric: boolean;
	public labels: LabelResponseModel[];
	public categories: LabelCategoryResponseModel[];
	public emailSuffix?: string;
	public videoConferenceUrl?: string;
	public description?: string;
	public additionalSettings: AdditionalSettings;
	/**
	 * @deprecated use additionalSettings.isStandAlone
	 */
	public isStandAlone: boolean;
	/**
	 * @isInt (Optional) Citizens can only make a booking at least X days in advance. No less than this.
	 */
	public minDaysInAdvance?: number | null;

	/**
	 * @isInt (Optional) Citizens can only make a booking up to X days in advance. No more than this.
	 */
	public maxDaysInAdvance?: number | null;
}

export class ServiceResponseV1 extends ServiceResponseBase {
	/**
	 * @isInt
	 */
	public id: number;
}

export class ServiceResponseV2 extends ServiceResponseBase {
	public id: string;
}

export class ServiceRequestBase {
	public name: string;
	public isSpAutoAssigned?: boolean;
	public noNric?: boolean;
	public labels?: LabelRequestModel[];
	public categories?: LabelCategoryRequestModel[];
	public emailSuffix?: string | null;
	public videoConferenceUrl?: string | null;
	public description?: string | null;
	public additionalSettings?: PartialAdditionalSettings;
	/**
	 * @isInt (Optional) Citizens can only make a booking at least X days in advance. No less than this.
	 */
	public minDaysInAdvance?: number | null;

	/**
	 * @isInt (Optional) Citizens can only make a booking up to X days in advance. No more than this.
	 */
	public maxDaysInAdvance?: number | null;
}

export class ServiceRequestV1 extends ServiceRequestBase {
	/**
	 * @isInt
	 */
	public organisationId?: number;
}

export class ServiceRequestV2 extends ServiceRequestBase {
	public organisationId?: string;
}

export class PartialAdditionalSettings {
	public allowAnonymousBookings?: boolean;
	public isOnHold?: boolean;
	public isStandAlone?: boolean;
	public sendNotifications?: boolean;
	public sendNotificationsToServiceProviders?: boolean;
	public sendSMSNotifications?: boolean;
}

export class AdditionalSettings {
	public allowAnonymousBookings: boolean;
	public isOnHold: boolean;
	public isStandAlone: boolean;
	public sendNotifications: boolean;
	public sendNotificationsToServiceProviders: boolean;
	public sendSMSNotifications: boolean;
}
