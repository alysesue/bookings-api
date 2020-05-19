import { Inject, Singleton } from "typescript-ioc";

import { Booking, BookingStatus } from "../models";

import { BookingsRepository } from "./bookings.repository";
import { CalendarsService } from "../calendars/calendars.service";
import { BookingAcceptRequest, BookingRequest, BookingSearchRequest } from "./bookings.apicontract";
import { isEmptyArray } from "../tools/arrays";

@Singleton
export class BookingsService {
	private static SessionDurationInMinutes = 60;

	@Inject
	private bookingsRepository: BookingsRepository;
	@Inject
	private calendarsService: CalendarsService;

	private static createBooking(bookingRequest: BookingRequest) {
		return new Booking(
			bookingRequest.startDateTime,
			this.SessionDurationInMinutes);
	}

	public async getBookings(): Promise<Booking[]> {
		return this.bookingsRepository.getBookings();
	}

	public async getBooking(bookingId: string): Promise<Booking> {
		const booking = await this.bookingsRepository.getBooking(bookingId);
		if (!booking) {
			throw new Error(`Booking ${bookingId} not found`);
		}
		return booking;
	}

	public async save(bookingRequest: BookingRequest): Promise<Booking> {
		const booking = BookingsService.createBooking(bookingRequest);

		await this.validateTimeSlot(booking);

		await this.bookingsRepository.save(booking);
		return booking;
	}

	public async getBookingRequests(from: Date, to: Date) {
		const searchBookingsRequest = new BookingSearchRequest(from, to, BookingStatus.PendingApproval);
		return await this.searchBookings(searchBookingsRequest);
	}

	public async acceptBooking(bookingId: string, acceptRequest: BookingAcceptRequest): Promise<Booking> {
		const booking = await this.getBookingForAccepting(bookingId);

		const calendar = await this.calendarsService.getCalendarForBookingRequest(booking, acceptRequest.calendarUUID);
		const eventICalId = await this.calendarsService.createCalendarEvent(booking, calendar);

		booking.status = BookingStatus.Accepted;
		booking.calendar = calendar;
		booking.eventICalId = eventICalId;
		booking.acceptedAt = new Date();

		await this.bookingsRepository.update(booking);

		return booking;
	}

	private async validateTimeSlot(booking: Booking) {
		const calendars = await this.calendarsService.searchCalendars(booking.startDateTime, booking.getSessionEndTime());

		if (isEmptyArray(calendars)) {
			throw new Error("No available calendars for this timeslot");
		}
		const bookingRequests = await this.getBookingRequests(booking.startDateTime, booking.getSessionEndTime());

		if (bookingRequests.length >= calendars.length) {
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
