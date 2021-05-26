import { Booking, Label, ServiceProvider } from '.';

const EmptyBookingArray: readonly Booking[] = [];

export type TimeslotInputData = {
	readonly capacity: number;
	readonly oneOffTimeslotId?: number;
	readonly labels?: Label[];
	readonly title?: string;
	readonly description?: string;
	readonly isRecurring?: boolean;
};

export type TimeslotServiceProviderResult = {
	serviceProvider: ServiceProvider;
	capacity: number;
	acceptedBookings: readonly Booking[];
	pendingBookings: readonly Booking[];
	availabilityCount: number;
	oneOffTimeslotId?: number;
	labels?: Label[];
	title?: string;
	description?: string;
	isRecurring?: boolean;
};

export interface ITimeslotServiceProvider {
	readonly capacity: number;
	readonly isRecurring: boolean;
	readonly isVisibleByUser: Boolean;

	acceptedBookings: readonly Booking[];
	pendingBookings: readonly Booking[];
	isOverlapped: Boolean;
	isUnavailable: Boolean;

	readonly oneOffTimeslotId: number | undefined;
	readonly labels: Label[] | undefined;
	readonly title: string | undefined;
	readonly description: string | undefined;

	makeWritable(): ITimeslotServiceProvider;
	setIsVisibleByUser(value: boolean): Readonly<ITimeslotServiceProvider>;
	getAvailabilityCount(maxAvailability?: number): number;
	isValid(): boolean;
}

export class TimeslotServiceProviderFactory {
	private constructor() {}
	public static create(timeslotData: TimeslotInputData): Readonly<ITimeslotServiceProvider> {
		return TimeslotServiceProvider.create(timeslotData);
	}
}

class TimeslotServiceProvider implements ITimeslotServiceProvider {
	private readonly _capacity?: number;

	private _isOneOffSlotOrBooking?: boolean;
	private _oneOffTimeslotId?: number;
	private _labels?: Label[];
	private _title?: string;
	private _description?: string;

	private _acceptedBookings?: readonly Booking[];
	private _pendingBookings?: readonly Booking[];
	private _isOverlapped?: boolean;
	private _isUnavailable?: boolean;
	private _isHiddenFromUser?: boolean;

	public get capacity(): number {
		if (this._isOverlapped || this._isUnavailable) return 0;
		return this._capacity || 0;
	}
	public get acceptedBookings(): readonly Booking[] {
		return this._acceptedBookings || EmptyBookingArray;
	}
	public set acceptedBookings(collection: readonly Booking[]) {
		if (collection && collection.length > 0) {
			this._acceptedBookings = collection;
		} else {
			delete this._acceptedBookings;
		}
	}
	public get pendingBookings(): readonly Booking[] {
		return this._pendingBookings || EmptyBookingArray;
	}
	public set pendingBookings(collection: readonly Booking[]) {
		if (collection && collection.length > 0) {
			this._pendingBookings = collection;
		} else {
			delete this._pendingBookings;
		}
	}
	public set isOverlapped(value: boolean) {
		if (value) {
			this._isOverlapped = value;
		} else {
			delete this._isOverlapped;
		}
	}

	public get isOverlapped(): boolean {
		return this._isOverlapped;
	}

	public set isUnavailable(value: boolean) {
		if (value) {
			this._isUnavailable = value;
		} else {
			delete this._isUnavailable;
		}
	}

	public get isUnavailable(): boolean {
		return this._isUnavailable;
	}

	public setIsVisibleByUser(value: boolean): Readonly<ITimeslotServiceProvider> {
		if (!value) {
			this._isHiddenFromUser = !value;
		} else {
			delete this._isHiddenFromUser;
		}
		return this;
	}

	public get isVisibleByUser(): boolean {
		return !this._isHiddenFromUser;
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

	public get isRecurring(): boolean | undefined {
		return !this._isOneOffSlotOrBooking;
	}

	public constructor(capacity: number) {
		if (capacity) {
			this._capacity = capacity;
		}
	}

	public makeWritable(): ITimeslotServiceProvider {
		return this;
	}

	public static create(timeslotData: TimeslotInputData): Readonly<ITimeslotServiceProvider> {
		let obj: Readonly<ITimeslotServiceProvider> =
			ReadonlyTimeslotServiceProvider.getFromCache(timeslotData.capacity || 0, true) ||
			new TimeslotServiceProvider(timeslotData.capacity);
		// Only makes it writable if any of the data is customised.

		// Sets if not recurring, because the default is true
		if (!timeslotData.isRecurring) {
			obj = obj.makeWritable();
			(obj as TimeslotServiceProvider)._isOneOffSlotOrBooking = !timeslotData.isRecurring;
		}

		if (timeslotData.oneOffTimeslotId) {
			obj = obj.makeWritable();
			(obj as TimeslotServiceProvider)._oneOffTimeslotId = timeslotData.oneOffTimeslotId;
		}

		if (timeslotData.labels && timeslotData.labels.length > 0) {
			obj = obj.makeWritable();
			(obj as TimeslotServiceProvider)._labels = timeslotData.labels;
		}

		if (timeslotData.title) {
			obj = obj.makeWritable();
			(obj as TimeslotServiceProvider)._title = timeslotData.title;
		}

		if (timeslotData.description) {
			obj = obj.makeWritable();
			(obj as TimeslotServiceProvider)._description = timeslotData.description;
		}

		return obj;
	}

	public getAvailabilityCount(maxAvailability?: number): number {
		return getAvailabilityCount(this, maxAvailability);
	}

	public isValid(): boolean {
		return isValid(this);
	}
}

function getAvailabilityCount(timeslot: ITimeslotServiceProvider, maxAvailability?: number): number {
	if (timeslot.isOverlapped || timeslot.isUnavailable) {
		return 0;
	}

	let value = Math.max(timeslot.capacity - timeslot.acceptedBookings.length - timeslot.pendingBookings.length, 0);
	if (maxAvailability !== undefined && maxAvailability !== null) {
		value = Math.min(value, maxAvailability);
	}

	return value;
}

function isValid(timeslot: ITimeslotServiceProvider) {
	if (timeslot.acceptedBookings.length > 0) return true;
	if (timeslot.isOverlapped || timeslot.isUnavailable) return false;
	return timeslot.capacity > 0;
}

class ReadonlyTimeslotServiceProvider implements Readonly<ITimeslotServiceProvider> {
	// Cache for Timeslot with IsRecurring = true, isVisibleByUser = true, and capacity = any
	private static readonly _cache: { [k: string]: Readonly<ITimeslotServiceProvider> } = {};
	// Cache for Timeslot with IsRecurring = true, isVisibleByUser = false, and capacity = any
	private static readonly _notVisibleByUserCache: { [k: string]: Readonly<ITimeslotServiceProvider> } = {};

	// This instance is reused across different times and service providers, so everything must be readonly.
	private readonly _capacity: number;
	private readonly _isVisibleByUser: boolean;

	private constructor(capacity: number, isVisibleByUser: boolean) {
		this._capacity = capacity;
		this._isVisibleByUser = isVisibleByUser;
	}

	public static getFromCache(
		capacity: number,
		isVisibleByUser: boolean,
	): Readonly<ITimeslotServiceProvider> | undefined {
		if (capacity > 1000) return undefined;

		const cacheObj = isVisibleByUser ? this._cache : this._notVisibleByUserCache;

		let instance = cacheObj[capacity];
		if (!instance) {
			instance = Object.freeze(new ReadonlyTimeslotServiceProvider(capacity, isVisibleByUser));
			cacheObj[capacity] = instance;
		}
		return instance;
	}

	get capacity(): number {
		return this._capacity;
	}

	public get isRecurring(): boolean {
		return true;
	}
	public get isVisibleByUser(): Boolean {
		return this._isVisibleByUser;
	}

	public get acceptedBookings(): readonly Booking[] {
		return EmptyBookingArray;
	}

	public get pendingBookings(): readonly Booking[] {
		return EmptyBookingArray;
	}

	public get isOverlapped(): Boolean {
		return false;
	}

	public get isUnavailable(): Boolean {
		return false;
	}

	public get oneOffTimeslotId(): number | undefined {
		return undefined;
	}
	public get labels(): Label[] | undefined {
		return undefined;
	}

	public get title(): string | undefined {
		return undefined;
	}

	public get description(): string | undefined {
		return undefined;
	}

	public setIsVisibleByUser(value: boolean): Readonly<ITimeslotServiceProvider> {
		if (this._isVisibleByUser === value) {
			return this;
		}
		return ReadonlyTimeslotServiceProvider.getFromCache(this._capacity, value);
	}

	public makeWritable(): ITimeslotServiceProvider {
		return new TimeslotServiceProvider(this._capacity);
	}

	public getAvailabilityCount(maxAvailability?: number): number {
		return getAvailabilityCount(this, maxAvailability);
	}

	public isValid(): boolean {
		return isValid(this);
	}
}
