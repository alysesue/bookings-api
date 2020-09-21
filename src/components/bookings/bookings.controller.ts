import { Inject } from 'typescript-ioc';
import {
	Body,
	Controller,
	Get,
	Header,
	Path,
	Post,
	Put,
	Query,
	Response,
	Route,
	Security,
	SuccessResponse,
	Tags,
} from 'tsoa';
import { BookingAcceptRequest, BookingRequest, BookingResponse, BookingSearchRequest } from './bookings.apicontract';
import { BookingsService } from './bookings.service';
import { TimeslotsService } from '../timeslots/timeslots.service';
import { MOLAuth } from 'mol-lib-common';
import { MOLUserAuthLevel } from 'mol-lib-api-contract/auth/auth-forwarder/common/MOLUserAuthLevel';
import { BookingsMapper } from './bookings.mapper';

@Route('v1/bookings')
@Tags('Bookings')
export class BookingsController extends Controller {
	@Inject
	private bookingsService: BookingsService;

	@Inject
	private timeslotService: TimeslotsService;

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
	@Security('service')
	@MOLAuth({ user: { minLevel: MOLUserAuthLevel.L2 } })
	@Response(401, 'Valid authentication types: [user]')
	public async postBooking(
		@Body() bookingRequest: BookingRequest,
		@Header('x-api-service') serviceId: number,
	): Promise<any> {
		bookingRequest.outOfSlotBooking = false;
		const booking = await this.bookingsService.save(bookingRequest, serviceId);
		this.setStatus(201);
		return BookingsMapper.mapDataModel(booking);
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
	@Security('service')
	@MOLAuth({ admin: {} })
	@Response(401, 'Valid authentication types: [admin]')
	public async postBookingOutOfSlot(
		@Body() bookingRequest: BookingRequest,
		@Header('x-api-service') serviceId: number,
	): Promise<any> {
		bookingRequest.outOfSlotBooking = true;
		const booking = await this.bookingsService.save(bookingRequest, serviceId);
		this.setStatus(201);
		return BookingsMapper.mapDataModel(booking);
	}

	/**
	 * Approves a booking and allocates a service provider to it. The booking must have Pending (1) status and the service provider (serviceProviderId) must be available for this booking timeslot otherwise the request will fail.
	 * @param bookingId The booking id.
	 * @param acceptRequest
	 */
	@Post('{bookingId}/accept')
	@SuccessResponse(204, 'Accepted')
	@MOLAuth({ admin: {} })
	@Response(401, 'Valid authentication types: [admin]')
	public async acceptBooking(@Path() bookingId: number, @Body() acceptRequest: BookingAcceptRequest): Promise<any> {
		await this.bookingsService.acceptBooking(bookingId, acceptRequest);
	}

	/**
	 * Cancels a booking. Only future bookings that have Pending (1) or Accepted (2) status can be cancelled.
	 * @param bookingId The booking id.
	 */
	@Post('{bookingId}/cancel')
	@SuccessResponse(204, 'Cancelled')
	@MOLAuth({
		admin: {},
		user: { minLevel: MOLUserAuthLevel.L2 },
	})
	@Response(401, 'Valid authentication types: [admin,user]')
	public async cancelBooking(@Path() bookingId: number): Promise<any> {
		await this.bookingsService.cancelBooking(bookingId);
	}

	/**
	 * Updates an existing booking.
	 * It will delete the exisitng booking and re-create a new booking based on request data.
	 * @param bookingId The booking id.
	 * @param bookingRequest
	 * @param serviceId The service (id) to be booked.
	 */
	@Put('{bookingId}')
	@SuccessResponse(201, 'Updated')
	@Security('service')
	@MOLAuth({ admin: {} })
	@Response(401, 'Valid authentication types: [admin]')
	public async updateBooking(
		@Path() bookingId: number,
		@Body() bookingRequest: BookingRequest,
		@Header('x-api-service') serviceId: number,
	): Promise<any> {
		const booking = await this.bookingsService.update(bookingId, bookingRequest, serviceId);
		this.setStatus(201);
		return BookingsMapper.mapDataModel(booking);
	}

	/**
	 * Retrieves all bookings that intercept the datetime range provided [from, to].
	 * @param from The lower bound datetime limit (inclusive) for booking's end time.
	 * @param to  The upper bound datetime limit (inclusive) for booking's start time.
	 * @param status (Optional) filters by a list of status: Pending (1), Accepted (2), Cancelled (3).
	 * @param citizenUinFins (Optional) filters by a list of citizen ids
	 * @param serviceId (Optional) filters by a service (id).
	 */
	@Get('')
	@SuccessResponse(200, 'Ok')
	@Security('optional-service')
	@MOLAuth({
		admin: {},
		user: { minLevel: MOLUserAuthLevel.L2 },
	})
	@Response(401, 'Valid authentication types: [admin,user]')
	public async getBookings(
		@Query() from: Date,
		@Query() to: Date,
		@Query() status?: number[],
		@Query() citizenUinFins?: string[],
		@Header('x-api-service') serviceId?: number,
	): Promise<BookingResponse[]> {
		const searchQuery = new BookingSearchRequest(from, to, status, serviceId, citizenUinFins);
		const bookings = await this.bookingsService.searchBookings(searchQuery);
		return BookingsMapper.mapDataModels(bookings);
	}

	/**
	 * Retrieves a single booking.
	 * @param bookingId The booking id.
	 */
	@Get('{bookingId}')
	@SuccessResponse(200, 'Ok')
	@MOLAuth({
		admin: {},
		user: { minLevel: MOLUserAuthLevel.L2 },
	})
	@Response(401, 'Valid authentication types: [admin,user]')
	public async getBooking(@Path() bookingId: number): Promise<any> {
		const booking = await this.bookingsService.getBooking(bookingId);
		return BookingsMapper.mapDataModel(booking);
	}

	/**
	 * Retrieves a list of available service providers for this booking timeslot.
	 * @param bookingId The booking id.
	 */
	@Get('{bookingId}/providers')
	@SuccessResponse(200, 'Ok')
	@MOLAuth({
		admin: {},
		user: { minLevel: MOLUserAuthLevel.L2 },
	})
	@Response(401, 'Valid authentication types: [admin,user]')
	public async getBookingProviders(@Path() bookingId: number): Promise<any> {
		const booking = await this.bookingsService.getBooking(bookingId);

		const timeslotEntry = await this.timeslotService.getAvailableProvidersForTimeslot(
			booking.startDateTime,
			booking.endDateTime,
			booking.serviceId,
		);
		return timeslotEntry.availableServiceProviders.map(BookingsMapper.mapProvider) || [];
	}

	/**
	 * Reject a booking request. Only Pending (1) bookings that can be rejected.
	 * @param bookingId The booking id.
	 */
	@Post('{bookingId}/reject')
	@SuccessResponse(200, 'Rejected')
	@MOLAuth({
		admin: {}
	})
	@Response(401, 'Valid authentication types: [admin]')
	public async rejectBooking(@Path() bookingId: number): Promise<any> {
		await this.bookingsService.rejectBooking(bookingId);
	}
}
