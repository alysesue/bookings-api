import { Inject, InRequestScope } from "typescript-ioc";
import { Booking, BookingStatus } from "../models";
import { BookingsRepository } from "./bookings.repository";
import { BookingAcceptRequest, BookingRequest, BookingSearchRequest } from "./bookings.apicontract";
import { isEmptyArray } from "../tools/arrays";
import { TimeslotsService } from '../timeslots/timeslots.service';
import { CalendarsService } from '../calendars/calendars.service';
import { ServiceConfiguration } from '../../src/common/serviceConfiguration';
import { DateHelper } from "../infrastructure/dateHelper";
import { ServiceProvidersRepository } from "../serviceProviders/serviceProviders.repository";

@InRequestScope
export class BookingsService {
	private static SessionDurationInMinutes = 60;

	@Inject
	private bookingsRepository: BookingsRepository;
	@Inject
	private calendarsService: CalendarsService;
	@Inject
	private timeslotsService: TimeslotsService;
	@Inject
	private serviceConfiguration: ServiceConfiguration;
	@Inject
	private serviceProviderRepo: ServiceProvidersRepository;

	private createBooking(bookingRequest: BookingRequest) {
		const serviceId = this.serviceConfiguration.getServiceId();
		if (!serviceId) {
			throw new Error('A service is required to make a booking');
		}

		return new Booking(
			serviceId,
			bookingRequest.startDateTime,
			BookingsService.SessionDurationInMinutes);
	}

	public async getBookings(): Promise<Booking[]> {
		return this.bookingsRepository.getBookings(this.serviceConfiguration.getServiceId());
	}

	public async getBooking(bookingId: string): Promise<Booking> {
		const booking = await this.bookingsRepository.getBooking(bookingId);
		if (!booking) {
			throw new Error(`Booking ${bookingId} not found`);
		}
		return booking;
	}

	public async save(bookingRequest: BookingRequest): Promise<Booking> {
		const booking = this.createBooking(bookingRequest);

		await this.validateTimeSlot(booking);

		await this.bookingsRepository.save(booking);
		return booking;
	}

	public async acceptBooking(bookingId: string, acceptRequest: BookingAcceptRequest): Promise<Booking> {
		const booking = await this.getBookingForAccepting(bookingId);

		const provider = await this.serviceProviderRepo.getServiceProvider(acceptRequest.serviceProviderId);
		if (!provider) {
			throw new Error(`Service provider '${acceptRequest.serviceProviderId}' not found`);
		}
		const availableProviders = await this.timeslotsService.getAvailableProvidersForTimeslot(booking.startDateTime, booking.getSessionEndTime(), booking.serviceId);
		const isCalendarAvailable = availableProviders.filter(e => e.id === acceptRequest.serviceProviderId).length > 0;
		if (!isCalendarAvailable) {
			throw new Error(`Service provider '${acceptRequest.serviceProviderId}' is not available for this booking.`);
		}

		const eventICalId = await this.calendarsService.createCalendarEvent(booking, provider.calendar);

		booking.status = BookingStatus.Accepted;
		booking.calendar = provider.calendar;
		booking.eventICalId = eventICalId;
		booking.acceptedAt = new Date();

		await this.bookingsRepository.update(booking);

		return booking;
	}

	private async validateTimeSlot(booking: Booking) {
		const timeslots = await this.timeslotsService.getAggregatedTimeslotsExactMatch(booking.startDateTime, booking.getSessionEndTime(), booking.serviceId);
		const timeslotEntry = timeslots.find(e => DateHelper.equals(e.startTime, booking.startDateTime)
			&& DateHelper.equals(e.endTime, booking.getSessionEndTime()));

		if (!timeslotEntry || timeslotEntry?.availabilityCount < 1) {
			throw new Error("No available calendars for this timeslot");
		}
	}

	private async getBookingForAccepting(bookingId: string): Promise<Booking> {
		const booking = await this.getBooking(bookingId);
		if (booking.status !== BookingStatus.PendingApproval) {
			throw new Error(`Booking ${bookingId} is in invalid state for accepting`);
		}
		return booking;
	}

	public async searchBookings(searchRequest: BookingSearchRequest): Promise<Booking[]> {
		return await this.bookingsRepository.search(searchRequest);
	}
}
