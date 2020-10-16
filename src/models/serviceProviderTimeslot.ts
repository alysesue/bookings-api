import { Booking, ServiceProvider } from '.';

export class ServiceProviderTimeslot {
	private readonly _serviceProvider: ServiceProvider;
	private _acceptedBookings: Booking[];
	private _pendingBookings: Booking[];
	private readonly _capacity: number;
	private _isOverlapped: boolean;
	private _isUnavailable: boolean;

	public get serviceProvider(): ServiceProvider {
		return this._serviceProvider;
	}

	public set acceptedBookings(value: Booking[]) {
		this._acceptedBookings = value;
	}
	public set pendingBookings(value: Booking[]) {
		this._pendingBookings = value;
	}
	public set isOverlapped(value: boolean) {
		this._isOverlapped = value;
	}
	public set isUnavailable(value: boolean) {
		this._isUnavailable = value;
	}

	constructor(serviceProvider: ServiceProvider, capacity: number) {
		this._serviceProvider = serviceProvider;
		this._capacity = capacity;
		this._acceptedBookings = [];
		this._pendingBookings = [];
		this._isOverlapped = false;
		this._isUnavailable = false;
	}

	public get availabilityCount() {
		if (this.isOverlapped || this.isUnavailable) return 0;
		return Math.max(this._capacity - this._acceptedBookings.length - this._pendingBookings.length, 0);
	}

	// pubic get isValid (){
	// 	return void;
	// }
}
