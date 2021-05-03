import { ServiceProviderSummaryModel } from '../serviceProviders/serviceProviders.apicontract';
import { BookingResponse } from '../bookings/bookings.apicontract';
import { LabelResponseModel } from '../labels/label.apicontract';

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
	 *
	 * @isInt
	 */
	public availabilityCount: number;
	/**
	 * The detail of service Providers information at this specific timeslot NEW
	 */
	public timeslotServiceProviders: CitizenTimeslotServiceProviderResponse[];
}

export class CitizenTimeslotServiceProviderResponse {
	/**
	 * The detail of the service provider
	 */
	public serviceProvider: ServiceProviderSummaryModel;
	/**
	 * The event title of the slot
	 */
	public eventTitle?: string;
	/**
	 * The event description of the slot
	 */
	public eventDescription?: string;
}

export class TimeslotServiceProviderResponse {
	/**
	 * The capacity value for this specific timeslot and service provider
	 *
	 * @isInt
	 */
	public capacity: number;
	/**
	 * The number of bookings in this timeslot assigned to the service provider
	 *
	 * @isInt
	 */
	public assignedBookingCount: number;
	/**
	 * The number of available slots for the service provider in this timeslot
	 *
	 * @isInt
	 */
	public availabilityCount: number;
	/**
	 * The detail of the service provider
	 */
	public serviceProvider: ServiceProviderSummaryModel;
	/**
	 * All accepted bookings assigned to this service provider
	 */
	public acceptedBookings: BookingResponse[];
	/**
	 * All pending bookings assigned to this service provider
	 */
	public pendingBookings: BookingResponse[];

	/**
	 * The one off timeslot id
	 */
	public oneOffTimeslotId?: string;

	/**
	 * The labels linked to the service
	 */
	public labels: LabelResponseModel[];

	/**
	 * The event title of the slot
	 */
	public eventTitle?: string;
	/**
	 * The event description of the slot
	 */
	public eventDescription?: string;
	/**
	 * Event recurring every week
	 */
	public isRecurring: boolean;
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
	 * The detail of service Providers information at this specific timeslot
	 */
	public timeslotServiceProviders: TimeslotServiceProviderResponse[];
	/**
	 * The total number of bookings assigned to a service provider
	 *
	 * @isInt
	 */
	public totalAssignedBookingCount: number;
	/**
	 * The total number of bookings not assigned to a service provider
	 *
	 * @isInt
	 */
	public totalUnassignedBookingCount: number;
	/**
	 * Total number of available slots for this specific time.
	 *
	 * @isInt
	 */
	public totalAvailabilityCount: number;
	/**
	 * Total capacity for this specific time.
	 *
	 * @isInt
	 */
	public totalCapacity: number;
}
