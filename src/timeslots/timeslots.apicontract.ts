import { ServiceProviderResponseModel } from '../serviceProviders/serviceProviders.apicontract';

export class AvailabilityEntryResponse {
	public startTime: Date;
	public endTime: Date;
	public availabilityCount: number;
}

export class TimeslotEntryResponse {
	public startTime: Date;
	public endTime: Date;
	public serviceProviders: ServiceProviderResponseModel[];
	public pendingBookingsCount: number;
}
