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
			endDateTime: booking.getSessionEndTime(),
			serviceId: booking.serviceId,
			serviceName: booking.service?.name,
			serviceProviderId: booking.serviceProviderId,
			serviceProviderName: booking.serviceProvider?.name,
			requestedAt: booking.createdAt,
		} as BookingResponse;
	}

	private static mapProvider(provider: ServiceProvider): BookingProviderResponse {
		return {
			id: provider.id,
			name: provider.name
		} as BookingProviderResponse;
	}

	@Post()
	@SuccessResponse(201, 'Created')
	@Security("service")
	public async postBooking(@Body() bookingRequest: BookingRequest, @Header("x-api-service") serviceId: number): Promise<any> {
		bookingRequest.outOfSlotBooking = false;
		const booking = await this.bookingsService.save(bookingRequest, serviceId);
		return BookingsController.mapDataModel(booking);
	}

	@Post('admin')
	@SuccessResponse(201, 'Created')
	@Security("service")
	public async postBookingOutOfSlot(@Body() bookingRequest: BookingRequest, @Header("x-api-service") serviceId: number): Promise<any> {
		bookingRequest.outOfSlotBooking = true;
		const booking = await this.bookingsService.save(bookingRequest, serviceId);
		return BookingsController.mapDataModel(booking);
	}

	@Post('{bookingId}/accept')
	@SuccessResponse(204, 'Accepted')
	public async acceptBooking(@Path() bookingId: number, @Body() acceptRequest: BookingAcceptRequest): Promise<any> {
		await this.bookingsService.acceptBooking(bookingId, acceptRequest);
	}

	@Post('{bookingId}/cancel')
	@SuccessResponse(204, 'Cancelled')
	public async cancelBooking(@Path() bookingId: number): Promise<any> {
		await this.bookingsService.cancelBooking(bookingId);
	}

	@Get('')
	@SuccessResponse(200, "Ok")
	@Security("optional-service")
	public async getBookings(
		@Query() from: Date,
		@Query() to: Date,
		@Query() status?: number,
		@Header("x-api-service") serviceId?: number): Promise<BookingResponse[]> {

		const searchQuery = new BookingSearchRequest(from, to, status, serviceId);
		const bookings = await this.bookingsService.searchBookings(searchQuery);
		return BookingsController.mapDataModels(bookings);
	}

	@Get('{bookingId}')
	@SuccessResponse(200, 'Ok')
	public async getBooking(@Path() bookingId: number): Promise<any> {
		const booking = await this.bookingsService.getBooking(bookingId);
		return BookingsController.mapDataModel(booking);
	}

	@Get('{bookingId}/providers')
	@SuccessResponse(200, 'Ok')
	public async getBookingProviders(@Path() bookingId: number): Promise<any> {
		const booking = await this.bookingsService.getBooking(bookingId);

		const timeslotEntry = await this.timeslotService.getAvailableProvidersForTimeslot(booking.startDateTime, booking.getSessionEndTime(), booking.serviceId);
		return timeslotEntry.availableServiceProviders.map(BookingsController.mapProvider) || [];
	}
}
