import { Inject } from "typescript-ioc";
import { Body, Controller, Get, Header, Path, Post, Query, Route, Security, SuccessResponse, Tags } from "tsoa";
import { Booking, ServiceProvider } from "../../models";
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
			startDateTime: booking.startDateTime,
			endDateTime: booking.endDateTime,
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

	/**
	 * Creates a new booking.
	 * [startDateTime, endDateTime] pair needs to match an available timeslot for the service or service provider.
	 * If serviceProviderId is specified, the booking status will be Accepted (2),
	 * otherwise the status will be Pending (1) and will require approval by an admin.
	 * @param bookingRequest
	 * @param serviceId The service (id) to be booked.
	 */
	@Post()
	@SuccessResponse(201, 'Created')
	@Security("service")
	public async postBooking(@Body() bookingRequest: BookingRequest, @Header("x-api-service") serviceId: number): Promise<any> {
		bookingRequest.outOfSlotBooking = false;
		const booking = await this.bookingsService.save(bookingRequest, serviceId);
		this.setStatus(201);
		return BookingsController.mapDataModel(booking);
	}

	/**
	 * Creates a new booking. Any startDateTime and endDateTime are allowed.
	 * If serviceProviderId is specified, the booking status will be Accepted (2),
	 * otherwise the status will be Pending (1) and will require approval by an admin.
	 * @param bookingRequest
	 * @param serviceId The service (id) to be booked.
	 */
	@Post('admin')
	@SuccessResponse(201, 'Created')
	@Security("service")
	public async postBookingOutOfSlot(@Body() bookingRequest: BookingRequest, @Header("x-api-service") serviceId: number): Promise<any> {
		bookingRequest.outOfSlotBooking = true;
		const booking = await this.bookingsService.save(bookingRequest, serviceId);
		this.setStatus(201);
		return BookingsController.mapDataModel(booking);
	}

	/**
	 * Approves a booking and allocates a service provider to it. The booking must have Pending (1) status and the service provider (serviceProviderId) must be available for this booking timeslot otherwise the request will fail.
	 * @param bookingId The booking id.
	 * @param acceptRequest
	 */
	@Post('{bookingId}/accept')
	@SuccessResponse(204, 'Accepted')
	public async acceptBooking(@Path() bookingId: number, @Body() acceptRequest: BookingAcceptRequest): Promise<any> {
		await this.bookingsService.acceptBooking(bookingId, acceptRequest);
	}

	/**
	 * Cancels a booking. Only future bookings that have Pending (1) or Accepted (2) status can be cancelled.
	 * @param bookingId The booking id.
	 */
	@Post('{bookingId}/cancel')
	@SuccessResponse(204, 'Cancelled')
	public async cancelBooking(@Path() bookingId: number): Promise<any> {
		await this.bookingsService.cancelBooking(bookingId);
	}

	/**
	 * Retrieves all bookings that have start time in the datetime range [from, to].
	 * @param from The lower bound datetime limit (inclusive) for booking's start.
	 * @param to  The upper bound datetime limit (inclusive) for booking's start.
	 * @param status (Optional) filters by a list of status: Pending (1), Accepted (2), Cancelled (3).
	 * @param serviceId (Optional) filters by a service (id).
	 */
	@Get('')
	@SuccessResponse(200, "Ok")
	@Security("optional-service")
	public async getBookings(
		@Query() from: Date,
		@Query() to: Date,
		@Query() status?: number[],
		@Header("x-api-service") serviceId?: number): Promise<BookingResponse[]> {

		const searchQuery = new BookingSearchRequest(from, to, status, serviceId);
		const bookings = await this.bookingsService.searchBookings(searchQuery);
		return BookingsController.mapDataModels(bookings);
	}

	/**
	 * Retrieves a single booking.
	 * @param bookingId The booking id.
	 */
	@Get('{bookingId}')
	@SuccessResponse(200, 'Ok')
	public async getBooking(@Path() bookingId: number): Promise<any> {
		const booking = await this.bookingsService.getBooking(bookingId);
		return BookingsController.mapDataModel(booking);
	}

	/**
	 * Retrieves a list of available service providers for this booking timeslot.
	 * @param bookingId The booking id.
	 */
	@Get('{bookingId}/providers')
	@SuccessResponse(200, 'Ok')
	public async getBookingProviders(@Path() bookingId: number): Promise<any> {
		const booking = await this.bookingsService.getBooking(bookingId);

		const timeslotEntry = await this.timeslotService.getAvailableProvidersForTimeslot(booking.startDateTime, booking.endDateTime, booking.serviceId);
		return timeslotEntry.availableServiceProviders.map(BookingsController.mapProvider) || [];
	}
}
