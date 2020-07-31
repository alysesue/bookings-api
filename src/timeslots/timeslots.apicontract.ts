import { ServiceProviderSummaryModel } from '../serviceProviders/serviceProviders.apicontract';

export class AvailabilityEntryResponse {
	public startTime: Date;
	public endTime: Date;
	/**
	 * The remaining number of available bookings that can be made in this timeslot.
	 */
	public availabilityCount: number;
}

export class TimeslotEntryResponse {
	public startTime: Date;
	public endTime: Date;
	/**
	 * A list of booked service providers (accepted) in this timeslot.
	 */
	public bookedServiceProviders: ServiceProviderSummaryModel[];
	/**
	 * A list of available service providers for this timeslot.
	 */
	public availableServiceProviders: ServiceProviderSummaryModel[];
	/**
	 * The number of pending bookings in this timeslot.
	 */
	public pendingBookingsCount: number;
	/**
	 * The remaining number of available bookings that can be made in this timeslot. This value may be less than the count of available service providers due to pending bookings.
	 */
	public availabilityCount: number;
}
