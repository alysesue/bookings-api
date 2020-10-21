import {
	ServiceProviderWithBookingsModel,
} from '../serviceProviders/serviceProviders.apicontract';
import { BookingResponse } from '../bookings/bookings.apicontract';

export class AvailabilityEntryResponse {
	/**
	 * Start time of this timeslot
	 */
	public startTime: Date;
	/**
	 * End time of this timeslot
	 */
	public endTime: Date;
	/**
	 * The remaining number of available bookings that can be made in this timeslot.
	 * @isInt
	 */
	public availabilityCount: number;
}

export class ServiceProviderTimeslotResponse {
	/**
	 * The number of capacity for this specific time.
	 * @isInt
	 */
	public capacity: number;
	/**
	 * The number of bookings in this timeslot.
	 * @isInt
	 */
	public bookingCount: number;
	/**
	 * The detail of the service provider
	 */
	public serviceProvider: ServiceProviderWithBookingsModel;
	/**
	 * The bookings that has been accepted by this service provider
	 */
	public acceptedBookings?: BookingResponse[];
	/**
	 * The pending bookings that has been assigned to this service provider
	 */
	public pendingBookings?: BookingResponse[];
}

export class TimeslotEntryResponse {
	/**
	 * Start time of this timeslot
	 */
	public startTime: Date;
	/**
	 * End time of this timeslot
	 */
	public endTime: Date;
	/**
	 * The detail of service Providers information at this specific time
	 */
	public serviceProviderTimeslot: ServiceProviderTimeslotResponse[];
	/**
	 * The total number of the booked slot (both assigned and not assigned yet to Service Provider)
	 * @isInt
	 */
	public totalBookingCount: number;
	/**
	 * Total capacity for this specific time.
	 * @isInt
	 */
	public totalCapacity: number;


}
