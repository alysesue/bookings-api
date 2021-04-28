import { ServiceProviderSummaryModel } from '../serviceProviders/serviceProviders.apicontract';

export class UnavailabilityResponse {
	public id: number;
	public startTime: Date;
	public endTime: Date;
	public allServiceProviders: boolean;
	public serviceProviders: ServiceProviderSummaryModel[];
}

export class UnavailabilityRequest {
	/**
	 * @ignore
	 */
	public serviceId: number;
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
	/**
	 * A list of service provider ids. This is only valid when allServiceProviders is equal to false, otherwise this value is ignored.
	 *
	 * @isInt
	 */
	public serviceProviderIds: number[];
}
