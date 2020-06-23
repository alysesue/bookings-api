import { ServiceProviderSummaryModel } from '../serviceProviders/serviceProviders.apicontract';

export class AvailabilityEntryResponse {
	public startTime: Date;
	public endTime: Date;
	public availabilityCount: number;
}

export class TimeslotEntryResponse {
	public startTime: Date;
	public endTime: Date;
	public bookedServiceProviders: ServiceProviderSummaryModel[];
	public availableServiceProviders: ServiceProviderSummaryModel[];
	public pendingBookingsCount: number;
	public availabilityCount: number;
}
