import { Booking, ServiceProvider, Unavailability } from '../../models';
import { groupByKey } from '../../tools/collections';
import {
	ITimeslotServiceProvider,
	TimeslotServiceProviderFactory,
	TimeslotServiceProviderResult,
} from '../../models/timeslotServiceProvider';
import { ServiceProvidersLookup } from './aggregatorTimeslotProviders';
import { TimeslotWithCapacity } from '../../models/timeslotWithCapacity';

const CapacityZero = { capacity: 0 } as TimeslotWithCapacity;
export class AvailableTimeslotProviders {
	public startTime: number;
	public endTime: number;
	private _timeslotServiceProviders: Readonly<{ [key: string]: Readonly<ITimeslotServiceProvider> }>;
	private _providerLookup: ServiceProvidersLookup;
	private _unassignedPendingBookingCount: number;

	constructor(providerLookup: ServiceProvidersLookup) {
		this._timeslotServiceProviders = {};
		this._providerLookup = providerLookup;
		this._unassignedPendingBookingCount = 0;
	}

	public get unassignedPendingBookingCount(): number {
		return this._unassignedPendingBookingCount;
	}

	public *getTimeslotServiceProviders(skipUnassigned = false): Iterable<TimeslotServiceProviderResult> {
		const totalAvailability = skipUnassigned ? undefined : this.getInternalAvailabilityCount();

		for (const [providerId, timeslotServiceProvider] of Object.entries(this._timeslotServiceProviders)) {
			if (timeslotServiceProvider.isVisibleByUser && timeslotServiceProvider.isValid()) {
				const provider = this._providerLookup.get(providerId);
				yield {
					serviceProvider: provider,
					capacity: timeslotServiceProvider.capacity,
					acceptedBookings: timeslotServiceProvider.acceptedBookings,
					pendingBookings: timeslotServiceProvider.pendingBookings,
					availabilityCount: timeslotServiceProvider.getAvailabilityCount(totalAvailability),
					oneOffTimeslotId: timeslotServiceProvider.oneOffTimeslotId,
					labels: timeslotServiceProvider.labels,
					title: timeslotServiceProvider.title,
					description: timeslotServiceProvider.description,
					isRecurring: timeslotServiceProvider.isRecurring,
				};
			}
		}
	}

	private getInternalAvailabilityCount(): number {
		let sumOfAvailability = 0;
		for (const item of Object.values(this._timeslotServiceProviders)) {
			sumOfAvailability += item.getAvailabilityCount();
		}

		return Math.max(sumOfAvailability - this._unassignedPendingBookingCount, 0);
	}

	public getAvailabilityCount(): number {
		const totalAvailability = this.getInternalAvailabilityCount();
		let sumAvailabilityVisible = 0;
		for (const timeslotSp of this.getTimeslotServiceProviders()) {
			sumAvailabilityVisible += timeslotSp.availabilityCount;
		}
		return Math.min(totalAvailability, sumAvailabilityVisible);
	}

	public isValidAndVisible(): boolean {
		for (const _timeslotSp of this.getTimeslotServiceProviders()) {
			if (_timeslotSp) return true;
		}
		return false;
	}

	public static empty(
		providerLookup: ServiceProvidersLookup,
		startTime: number,
		endTime: number,
	): AvailableTimeslotProviders {
		const instance = new AvailableTimeslotProviders(providerLookup);
		instance.startTime = startTime;
		instance.endTime = endTime;
		return instance;
	}

	private setTimeslotSp(spId: string | number, timeslotSp: Readonly<ITimeslotServiceProvider>) {
		(this._timeslotServiceProviders as {})[spId] = timeslotSp;
	}

	public addServiceProvider(provider: ServiceProvider, timeslotCapacity: TimeslotWithCapacity) {
		this._providerLookup.add(provider);
		const spTimeslotItem = TimeslotServiceProviderFactory.create(timeslotCapacity);
		this.setTimeslotSp(provider.id, spTimeslotItem);
	}

	private getWritableTimeslot(providerId: string | number): ITimeslotServiceProvider | undefined {
		const readable = this._timeslotServiceProviders[providerId];
		if (!readable) {
			return undefined;
		}

		const writable = readable.makeWritable();
		if (readable !== writable) {
			this.setTimeslotSp(providerId, writable);
		}

		return writable;
	}

	public *getServiceProviders(): Iterable<ServiceProvider> {
		for (const key of Object.keys(this._timeslotServiceProviders)) {
			yield this._providerLookup.get(key);
		}
	}

	public hasServiceProviderId(providerId: number) {
		return !!this._timeslotServiceProviders[providerId];
	}

	public setBookedServiceProviders(bookings: Booking[]) {
		const bookedProviderIds = groupByKey(bookings, (b) => b.serviceProviderId);

		for (const item of bookedProviderIds) {
			const [spId, spBookings] = item;
			const spTimeslotItem = this.getWritableTimeslot(spId);
			if (spTimeslotItem) {
				spTimeslotItem.acceptedBookings = spBookings;
			} else {
				const provider = spBookings[0].serviceProvider;
				this.addServiceProvider(provider, CapacityZero);
				const newTimeslotItem = this.getWritableTimeslot(provider.id);
				newTimeslotItem.acceptedBookings = spBookings;
			}
		}
	}

	public setOverlappingServiceProviders(providerIds: number[]) {
		for (const id of providerIds) {
			const spTimeslotItem = this.getWritableTimeslot(id);
			if (spTimeslotItem) spTimeslotItem.isOverlapped = true;
		}
	}

	public setUnavailability(unavailability: Unavailability) {
		if (unavailability.allServiceProviders) {
			for (const providerId of Object.keys(this._timeslotServiceProviders)) {
				const spTimeslot = this.getWritableTimeslot(providerId);
				spTimeslot.isUnavailable = true;
			}
		} else {
			for (const unavailableSp of unavailability.serviceProviders) {
				const spTimeslotItem = this.getWritableTimeslot(unavailableSp.id);
				if (spTimeslotItem) spTimeslotItem.isUnavailable = true;
			}
		}
	}

	public addPendingBookings(bookings: Booking[]): void {
		const assignedPendingBookings = bookings.filter((b) => b.serviceProviderId);
		const spWithPendingBooking = groupByKey(assignedPendingBookings, (b) => b.serviceProviderId);

		this._unassignedPendingBookingCount = bookings.length - assignedPendingBookings.length;

		for (const item of spWithPendingBooking) {
			const [spid, pendingBookings] = item;
			const spTimeslotItem = this.getWritableTimeslot(spid);
			if (spTimeslotItem) {
				spTimeslotItem.pendingBookings = [...spTimeslotItem.pendingBookings, ...pendingBookings];
			}
		}
	}

	public setVisibleServiceProviders(providerIds: number[]): void {
		const visibility: { [key: string]: Boolean } = providerIds.reduce((r, id) => {
			r[id] = true;
			return r;
		}, {});

		for (const providerId of Object.keys(this._timeslotServiceProviders)) {
			const isVisible = !!visibility[providerId];
			const timeslotSp = this._timeslotServiceProviders[providerId];
			if (timeslotSp.isVisibleByUser !== isVisible) {
				this.setTimeslotSp(providerId, timeslotSp.setIsVisibleByUser(isVisible));
			}
		}
	}
}
