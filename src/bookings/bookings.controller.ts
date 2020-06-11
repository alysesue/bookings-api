import { logger } from "mol-lib-common/debugging/logging/LoggerV2";
import { Inject } from "typescript-ioc";
import { Body, Controller, Get, Header, Path, Post, Query, Route, Security, SuccessResponse, Tags } from "tsoa";
import { Booking, ServiceProvider } from "../models";
import {
	BookingAcceptRequest,
	BookingProviderResponse,
	BookingRequest,
	BookingResponse,
	BookingSearchRequest
} from "./bookings.apicontract";
import { BookingsService } from "./bookings.service";
import { ErrorResponse } from "../apicontract";
import { TimeslotsService } from "../timeslots/timeslots.service";

@Route("v1/bookings")
@Tags('Bookings')
export class BookingsController extends Controller {
	@Inject
	private bookingsService: BookingsService;

	@Inject
	private timeslotService: TimeslotsService;

	private static mapDataModels(bookings: Booking[]): BookingResponse[] {
		return bookings?.map(BookingsController.mapDataModel);
	}

	private static mapDataModel(booking: Booking): BookingResponse {
		return {
			id: booking.id,
			status: booking.status,
			sessionDurationInMinutes: booking.sessionDurationInMinutes,
			startDateTime: booking.startDateTime,
			endDateTime: booking.getSessionEndTime()
		} as BookingResponse;
	}

	private static mapProvider(provider: ServiceProvider): BookingProviderResponse {
		return {
			id: provider.id,
			name: provider.name
		} as BookingProviderResponse;
	}

	@Get()
	@SuccessResponse(200, 'Ok')
	@Security("optional-service")
	public async getBookings(@Header("x-api-service") serviceId?: number): Promise<BookingResponse[]> {
		const bookings = await this.bookingsService.getBookings(serviceId);
		return BookingsController.mapDataModels(bookings);
	}

	@Post()
	@SuccessResponse(201, 'Created')
	@Security("service")
	public async postBooking(@Body() bookingRequest: BookingRequest, @Header("x-api-service") serviceId: number): Promise<any> {
		try {
			const booking = await this.bookingsService.save(bookingRequest, serviceId);
			return BookingsController.mapDataModel(booking);
		} catch (err) {
			logger.error("endpointPostBooking:: error: ", err);
			this.setStatus(400);
			return new ErrorResponse(err.message);
		}
	}

	@Post('{bookingId}/accept')
	@SuccessResponse(204, 'Accepted')
	public async acceptBooking(@Path() bookingId: string, @Body() acceptRequest: BookingAcceptRequest): Promise<any> {
		try {
			await this.bookingsService.acceptBooking(bookingId, acceptRequest);
		} catch (err) {
			logger.error("endpointAcceptBooking:: error: ", err);
			this.setStatus(400);
			return new ErrorResponse(err.message);
		}
	}

	@Get('search')
	@SuccessResponse(200, "Ok")
	@Security("optional-service")
	public async searchBookings(@Query() status: number,
		@Query() from: Date,
		@Query() to: Date,
		@Header("x-api-service") serviceId?: number): Promise<BookingResponse[]> {

		const searchQuery = new BookingSearchRequest(from, to, status, serviceId);
		const bookings = await this.bookingsService.searchBookings(searchQuery);
		return BookingsController.mapDataModels(bookings);
	}

	@Get('{bookingId}')
	@SuccessResponse(200, 'Ok')
	public async getBooking(@Path() bookingId: string): Promise<any> {
		try {
			const booking = await this.bookingsService.getBooking(bookingId);
			return BookingsController.mapDataModel(booking);
		} catch (err) {
			logger.error("endpointPostBooking:: error: ", err);
			this.setStatus(400);
			return new ErrorResponse(err.message);
		}
	}

	@Get('{bookingId}/providers')
	@SuccessResponse(200, 'Ok')
	public async getBookingProviders(@Path() bookingId: string): Promise<any> {
		let booking: Booking;
		try {
			booking = await this.bookingsService.getBooking(bookingId);
		} catch (err) {
			logger.error("endpointPostBooking:: error: ", err);
			this.setStatus(400);
			return new ErrorResponse(err.message);
		}

		const timeslotEntry = await this.timeslotService.getAvailableProvidersForTimeslot(booking.startDateTime, booking.getSessionEndTime(), booking.serviceId);
		return timeslotEntry.serviceProviders.map(BookingsController.mapProvider) || [];
	}
}
