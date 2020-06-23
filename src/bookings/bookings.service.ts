import { ErrorCodeV2, MOLErrorV2 } from "mol-lib-api-contract";
import { Inject, InRequestScope } from "typescript-ioc";
import { Booking, BookingStatus } from "../models";
import { BookingsRepository } from "./bookings.repository";
import { BookingAcceptRequest, BookingRequest, BookingSearchRequest } from "./bookings.apicontract";
import { TimeslotsService } from '../timeslots/timeslots.service';
import { CalendarsService } from '../calendars/calendars.service';
import { DateHelper } from "../infrastructure/dateHelper";
import { ServiceProvidersRepository } from "../serviceProviders/serviceProviders.repository";

@InRequestScope
export class BookingsService {
	@Inject
	private bookingsRepository: BookingsRepository;
	@Inject
	private calendarsService: CalendarsService;
	@Inject
	private timeslotsService: TimeslotsService;
	@Inject
	private serviceProviderRepo: ServiceProvidersRepository;

	private createBooking(bookingRequest: BookingRequest, serviceId: number) {
		const duration = Math.floor(DateHelper.DiffInMinutes(bookingRequest.endDateTime, bookingRequest.startDateTime));
		if (duration <= 0) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('End time for booking must be greater than start time');
		}

		return Booking.create(
			serviceId,
			bookingRequest.startDateTime,
			duration);
	}

	public async getBookings(serviceId?: number): Promise<Booking[]> {
		return this.bookingsRepository.getBookings(serviceId);
	}

	public async getBooking(bookingId: string): Promise<Booking> {
		const booking = await this.bookingsRepository.getBooking(bookingId);
		if (!booking) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage(`Booking ${bookingId} not found`);
		}
		return booking;
	}

	public async save(bookingRequest: BookingRequest, serviceId: number): Promise<Booking> {
		// Potential improvement: each [serviceId, bookingRequest.startDateTime, bookingRequest.endDateTime] save method call should be executed serially.
		// Method calls with different services, or timeslots should still run in parallel.
		const booking = this.createBooking(bookingRequest, serviceId);

		await this.validateTimeSlot(booking);

		await this.bookingsRepository.save(booking);
		return booking;
	}

	public async acceptBooking(bookingId: string, acceptRequest: BookingAcceptRequest): Promise<Booking> {
		const booking = await this.getBookingForAccepting(bookingId);

		const provider = await this.serviceProviderRepo.getServiceProvider({ id: acceptRequest.serviceProviderId });
		if (!provider) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(`Service provider '${acceptRequest.serviceProviderId}' not found`);
		}
		const timeslotEntry = await this.timeslotsService.getAvailableProvidersForTimeslot(booking.startDateTime, booking.getSessionEndTime(), booking.serviceId);
		const isProviderAvailable = timeslotEntry.availableServiceProviders.filter(e => e.id === acceptRequest.serviceProviderId).length > 0;
		if (!isProviderAvailable) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(`Service provider '${acceptRequest.serviceProviderId}' is not available for this booking.`);
		}

		const eventICalId = await this.calendarsService.createCalendarEvent(booking, provider.calendar);

		booking.status = BookingStatus.Accepted;
		booking.serviceProvider = provider;
		booking.eventICalId = eventICalId;
		booking.acceptedAt = new Date();

		await this.bookingsRepository.update(booking);

		return booking;
	}

	private async validateTimeSlot(booking: Booking) {
		const timeslotEntry = await this.timeslotsService.getAvailableProvidersForTimeslot(booking.startDateTime, booking.getSessionEndTime(), booking.serviceId);

		if (timeslotEntry.availabilityCount < 1) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage("No available service providers for this timeslot");
		}
	}

	private async getBookingForAccepting(bookingId: string): Promise<Booking> {
		const booking = await this.getBooking(bookingId);
		if (booking.status !== BookingStatus.PendingApproval) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(`Booking ${bookingId} is in invalid state for accepting`);
		}
		return booking;
	}

	public async searchBookings(searchRequest: BookingSearchRequest): Promise<Booking[]> {
		return await this.bookingsRepository.search(searchRequest);
	}
}
