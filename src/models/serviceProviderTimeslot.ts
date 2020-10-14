import { ServiceProvider, Booking } from ".";

export class ServiceProviderTimeslot {
	private serviceProvider: ServiceProvider;
	private _bookings: Booking[];
	private _capacity: number;
	private _availability: number;
}
