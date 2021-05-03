import { Booking, Label, ServiceProvider } from '.';

export type TimeslotServiceProviderResult = {
	serviceProvider: ServiceProvider;
	capacity: number;
	acceptedBookings: Booking[];
	pendingBookings: Booking[];
	availabilityCount: number;
	oneOffTimeslotId?: number;
	labels?: Label[];
	title?: string;
	description?: string;
	isRecurring: boolean;
};

export class TimeslotServiceProvider {
	private readonly _serviceProvider: ServiceProvider;
	private _acceptedBookings: Booking[];
	private _pendingBookings: Booking[];
	private readonly _capacity: number;
	private _isOverlapped: boolean;
	private _isUnavailable: boolean;
	private _isVisibleByUser: boolean;
	private readonly _oneOffTimeslotId?: number;
	private readonly _labels?: Label[];
	private readonly _title?: string;
	private readonly _description?: string;
	private readonly _isRecurring?: boolean;

	public get capacity(): number {
		return this._capacity;
	}
	public get serviceProvider(): ServiceProvider {
		return this._serviceProvider;
	}
	public get acceptedBookings() {
		return this._acceptedBookings;
	}
	public set acceptedBookings(value: Booking[]) {
		this._acceptedBookings = value;
	}
	public get pendingBookings() {
		return this._pendingBookings;
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

	public set isVisibleByUser(value: boolean) {
		this._isVisibleByUser = value;
	}

	public get isVisibleByUser(): boolean {
		return this._isVisibleByUser;
	}

	public get oneOffTimeslotId(): number | undefined {
		return this._oneOffTimeslotId;
	}

	public get labels(): Label[] | undefined {
		return this._labels;
	}

	public get title(): string | undefined {
		return this._title;
	}

	public get description(): string | undefined {
		return this._description;
	}

	public get isRecurring(): boolean {
		return this._isRecurring;
	}

	constructor(
		serviceProvider: ServiceProvider,
		timeslotData: {
			readonly capacity: number;
			readonly oneOffTimeslotId?: number;
			readonly labels?: Label[];
			readonly title?: string;
			readonly description?: string;
			readonly isRecurring?: boolean;
		},
	) {
		this._serviceProvider = serviceProvider;
		this._capacity = timeslotData.capacity;
		this._acceptedBookings = [];
		this._pendingBookings = [];
		this._isOverlapped = false;
		this._isUnavailable = false;
		this._isVisibleByUser = true;
		this._oneOffTimeslotId = timeslotData.oneOffTimeslotId;
		this._labels = timeslotData.labels;
		this._title = timeslotData.title;
		this._description = timeslotData.description;
		this._isRecurring = timeslotData.isRecurring;
	}

	public getAvailabilityCount(maxAvailability?: number): number {
		if (this.isOverlapped || this.isUnavailable) {
			return 0;
		}

		let value = Math.max(this._capacity - this._acceptedBookings.length - this._pendingBookings.length, 0);
		if (maxAvailability !== undefined && maxAvailability !== null) {
			value = Math.min(value, maxAvailability);
		}

		return value;
	}

	public isValid(): boolean {
		if (this._acceptedBookings.length > 0) return true;
		if (this._isOverlapped || this._isUnavailable) return false;
		return this._capacity > 0;
	}
}
