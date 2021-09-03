import {
	ServiceProviderSummaryModelV1,
	ServiceProviderSummaryModelV2,
} from '../serviceProviders/serviceProviders.apicontract';

export class UnavailabilityResponseBase {
	public startTime: Date;
	public endTime: Date;
	public allServiceProviders: boolean;
}

export class UnavailabilityResponseV1 extends UnavailabilityResponseBase {
	public id: number;
	public serviceProviders: ServiceProviderSummaryModelV1[];
}

export class UnavailabilityResponseV2 extends UnavailabilityResponseBase {
	public id: string;
	public serviceProviders: ServiceProviderSummaryModelV2[];
}

export class UnavailabilityRequestBase {
	/**
	 * The start datetime value. It must be less than end datetime.
	 */
	public startTime: Date;
	/**
	 * The end datetime value.
	 */
	public endTime: Date;
	/**
	 * Whether this unavailability applies to all service providers (under service).
	 */
	public allServiceProviders: boolean;
}

export class UnavailabilityRequestV1 extends UnavailabilityRequestBase {
	/**
	 * @ignore
	 */
	public serviceId: number;
	/**
	 * A list of service provider ids. This is only valid when allServiceProviders is equal to false, otherwise this value is ignored.
	 *
	 * @isInt
	 */
	public serviceProviderIds: number[];
}

export class UnavailabilityRequestV2 extends UnavailabilityRequestBase {
	/**
	 * @ignore
	 */
	public serviceId: string;
	/**
	 * A list of service provider ids. This is only valid when allServiceProviders is equal to false, otherwise this value is ignored.
	 *
	 * @isInt
	 */
	public serviceProviderIds: string[];
}
