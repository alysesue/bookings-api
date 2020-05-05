import { Inject, Singleton } from "typescript-ioc";

import { Booking } from "../models";

import { BookingsRepository } from "./bookings.repository";
import { BookingRequest } from "./booking.request";
import {CalendarsService} from "../calendars/calendars.service";

@Singleton
export class BookingsService {

	private static SessionDurationInMinutes = 60;

	@Inject
	private bookingsRepository: BookingsRepository;
	@Inject
	private calendarsService: CalendarsService;

	public async getBookings(): Promise<Booking[]> {
		return this.bookingsRepository.getBookings();
	}

	public async save(bookingRequest: BookingRequest): Promise<Booking> {
		await this.calendarsService.validateTimeSlot(bookingRequest.startDateTime, BookingsService.SessionDurationInMinutes);

		const booking = BookingsService.createBooking(bookingRequest);
		await this.bookingsRepository.save(booking);
		return booking;
	}

	private static createBooking(bookingRequest: BookingRequest) {
		return new Booking(
			bookingRequest.startDateTime,
			this.SessionDurationInMinutes
		);
	}
}
