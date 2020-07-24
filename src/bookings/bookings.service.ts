import { ErrorCodeV2, MOLErrorV2 } from "mol-lib-api-contract";
import { Inject, InRequestScope } from "typescript-ioc";
import { Booking, BookingStatus } from "../models";
import { BookingsRepository } from "./bookings.repository";
import { BookingAcceptRequest, BookingRequest, BookingSearchRequest } from "./bookings.apicontract";
import { TimeslotsService } from '../timeslots/timeslots.service';
import { CalendarsService } from '../calendars/calendars.service';
import { DateHelper } from "../infrastructure/dateHelper";
import { ServiceProvidersRepository } from "../serviceProviders/serviceProviders.repository";
import { intersectsDateTimeSpan } from "../tools/timeSpan";

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

	public formatEventId(event: string): string {
		return event.split("@")[0];
	}

	private async createBooking(bookingRequest: BookingRequest, serviceId: number): Promise<Booking> {
		const duration = Math.floor(DateHelper.DiffInMinutes(bookingRequest.endDateTime, bookingRequest.startDateTime));
		if (duration <= 0) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('End time for booking must be greater than start time');
		}

		if (bookingRequest.serviceProviderId) {
			const provider = await this.serviceProviderRepo.getServiceProvider({ id: bookingRequest.serviceProviderId });
			if (!provider) {
				throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(`Service provider '${bookingRequest.serviceProviderId}' not found`);
			}
		}

		return Booking.create(
			serviceId,
			bookingRequest.startDateTime,
			duration,
			bookingRequest.serviceProviderId,
			bookingRequest.refId);
	}

	public async getBooking(bookingId: number): Promise<Booking> {
		const booking = await this.bookingsRepository.getBooking(bookingId);
		if (!booking) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage(`Booking ${bookingId} not found`);
		}
		return booking;
	}

	public async save(bookingRequest: BookingRequest, serviceId: number): Promise<Booking> {
		// Potential improvement: each [serviceId, bookingRequest.startDateTime, bookingRequest.endDateTime] save method call should be executed serially.
		// Method calls with different services, or timeslots should still run in parallel.
		const booking = await this.createBooking(bookingRequest, serviceId);
		const {startDateTime, endDateTime, serviceProviderId} = bookingRequest;

		if(!bookingRequest.outOfSlotBooking) {
			await this.validateTimeSlot(booking);
		} else {
			const acceptedBookings = await this.timeslotsService.getAcceptedBookings(startDateTime, endDateTime, serviceId, serviceProviderId);

			for (const item of acceptedBookings) {
				const intersects = intersectsDateTimeSpan({start: booking.startDateTime, end: booking.getSessionEndTime()}, item.startDateTime, item.getSessionEndTime());
				if (intersects) {
					throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(`Booking request not valid as it overlaps another accepted booking`);
				}
			}
		}

		await this.bookingsRepository.save(booking);
		return this.getBooking(booking.id);
	}

	public async cancelBooking(bookingId: number): Promise<Booking> {
		const booking = await this.getBookingForCancelling(bookingId);
		const eventCalId = booking.eventICalId;
		if (booking.status === BookingStatus.Accepted) {
			const provider = await this.serviceProviderRepo.getServiceProvider({ id: booking.serviceProviderId });
			if (!provider) {
				throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(`Service provider '${booking.serviceProviderId}' not found`);

			}
			await this.calendarsService.deleteCalendarEvent(provider.calendar, this.formatEventId(eventCalId));
		}
		booking.status = BookingStatus.Cancelled;
		await this.bookingsRepository.update(booking);

		return booking;
	}

	public async acceptBooking(bookingId: number, acceptRequest: BookingAcceptRequest): Promise<Booking> {
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
		const timeslotEntry = await this.timeslotsService.getAvailableProvidersForTimeslot(booking.startDateTime, booking.getSessionEndTime(), booking.serviceId, booking.serviceProviderId);

		if (timeslotEntry.availabilityCount < 1) {
			const errorMessage = booking.serviceProviderId ? "The service provider is not available for this timeslot"
				: "No available service providers for this timeslot";
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(errorMessage);
		}
	}

	private async getBookingForAccepting(bookingId: number): Promise<Booking> {
		const booking = await this.getBooking(bookingId);
		if (booking.status !== BookingStatus.PendingApproval) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(`Booking ${bookingId} is in invalid state for accepting`);
		}
		return booking;
	}

	private async getBookingForCancelling(bookingId: number): Promise<Booking> {
		const booking = await this.getBooking(bookingId);
		if (booking.status === BookingStatus.Cancelled || booking.startDateTime < new Date()) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(`Booking ${bookingId} is in invalid state for cancelling`);

		}
		return booking;
	}
	public async searchBookings(searchRequest: BookingSearchRequest): Promise<Booking[]> {
		return await this.bookingsRepository.search(searchRequest);
	}
}
