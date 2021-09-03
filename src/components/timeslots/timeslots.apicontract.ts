import {
	ServiceProviderSummaryModelV1,
	ServiceProviderSummaryModelV2,
} from '../serviceProviders/serviceProviders.apicontract';
import { BookingResponseV1, BookingResponseV2 } from '../bookings/bookings.apicontract';
import { LabelResponseModel } from '../labels/label.apicontract';

export class AvailabilityEntryResponseBase {
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
}

export class AvailabilityEntryResponseV1 extends AvailabilityEntryResponseBase {
	/**
	 * The detail of service Providers information at this specific timeslot.
	 * This is only returned when exactTimeslot=true in the parameters
	 */
	public timeslotServiceProviders?: CitizenTimeslotServiceProviderResponseV1[];
}

export class AvailabilityEntryResponseV2 extends AvailabilityEntryResponseBase {
	/**
	 * The detail of service Providers information at this specific timeslot.
	 * This is only returned when exactTimeslot=true in the parameters
	 */
	public timeslotServiceProviders?: CitizenTimeslotServiceProviderResponseV2[];
}

export class CitizenTimeslotServiceProviderResponseBase {
	/**
	 * The event title of the slot
	 */
	public eventTitle?: string;
	/**
	 * The event description of the slot
	 */
	public eventDescription?: string;
}

export class CitizenTimeslotServiceProviderResponseV1 extends CitizenTimeslotServiceProviderResponseBase {
	/**
	 * The detail of the service provider
	 */
	public serviceProvider: ServiceProviderSummaryModelV1;
}

export class CitizenTimeslotServiceProviderResponseV2 extends CitizenTimeslotServiceProviderResponseBase {
	/**
	 * The detail of the service provider
	 */
	public serviceProvider: ServiceProviderSummaryModelV2;
}

export class TimeslotServiceProviderResponseBase {
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

export class TimeslotServiceProviderResponseV1 extends TimeslotServiceProviderResponseBase {
	/**
	 * The detail of the service provider
	 */
	public serviceProvider: ServiceProviderSummaryModelV1;
	/**
	 * All accepted bookings assigned to this service provider
	 */
	public acceptedBookings: BookingResponseV1[];
	/**
	 * All pending bookings assigned to this service provider
	 */
	public pendingBookings: BookingResponseV1[];
}

export class TimeslotServiceProviderResponseV2 extends TimeslotServiceProviderResponseBase {
	/**
	 * The detail of the service provider
	 */
	public serviceProvider: ServiceProviderSummaryModelV2;
	/**
	 * All accepted bookings assigned to this service provider
	 */
	public acceptedBookings: BookingResponseV2[];
	/**
	 * All pending bookings assigned to this service provider
	 */
	public pendingBookings: BookingResponseV2[];
}

export class TimeslotEntryResponseBase {
	/**
	 * Start time of this timeslot
	 */
	public startTime: Date;
	/**
	 * End time of this timeslot
	 */
	public endTime: Date;
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

export class TimeslotEntryResponseV1 extends TimeslotEntryResponseBase {
	/**
	 * The detail of service Providers information at this specific timeslot
	 */
	public timeslotServiceProviders: TimeslotServiceProviderResponseV1[];
}

export class TimeslotEntryResponseV2 extends TimeslotEntryResponseBase {
	/**
	 * The detail of service Providers information at this specific timeslot
	 */
	public timeslotServiceProviders: TimeslotServiceProviderResponseV2[];
}

export class AvailabilityByDayResponse {
	/**
	 * Date for the number of slots
	 */
	public date: Date;
	/**
	 * Total number of available slots for this specific date.
	 *
	 * @isInt
	 */
	public totalAvailabilityCount: number;

	constructor(date: Date, count: number) {
		this.date = date;
		this.totalAvailabilityCount = count;
	}
}
