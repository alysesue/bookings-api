import { ServiceProviderSummaryModel } from "../serviceProviders/serviceProviders.apicontract";

export class UnavailabilityResponse {
	public start: Date;
	public end: Date;
	public allServiceProviders: boolean;
	public serviceProviders: ServiceProviderSummaryModel[];
}

export class UnavailabilityRequest {
	/**
	 * @ignore
	 */
	public serviceId: number;
	public start: Date;
	public end: Date;
	public allServiceProviders: boolean;
	public serviceProviderIds: number[];
}
