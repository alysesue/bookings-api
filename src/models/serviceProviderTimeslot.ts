import { ServiceProvider, Booking } from ".";

export class ServiceProviderTimeslot {
	private readonly _serviceProvider: ServiceProvider;
	private _acceptedBookings: Booking[];
	private _pendingBookings: Booking[];
	private readonly _capacity: number;
	private _availability: number;
	private _isOverlapped: boolean;
	private _isUnavailable: boolean;

	public set acceptedBookings(value: Booking[]) {
		this._acceptedBookings = value;
	}
	public set pendingBookings(value: Booking[]) {
		this._pendingBookings = value;
	}
	public set isOverlapped(value: boolean) {
		this._isOverlapped = value;
		if (value) this._availability = 0;
	}
	public set isUnavailable(value: boolean) {
		this._isUnavailable = value;
		if (value) this._availability = 0;
	}

	constructor(serviceProvider: ServiceProvider, capacity: number) {
		this._serviceProvider = serviceProvider;
		this._capacity = capacity;
		this._acceptedBookings = [];
		this._pendingBookings = [];
		this._availability = capacity;
		this._isOverlapped = false;
		this._isUnavailable = false;
	}

	public get availabilityCount() {
		return Math.max((this._availability - this._acceptedBookings.length - this._pendingBookings.length), 0);
	}
}
