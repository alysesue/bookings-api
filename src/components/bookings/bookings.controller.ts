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
import {
	BookingAcceptRequest,
	BookingDetailsRequest,
	BookingProviderResponse,
	BookingRequest,
	BookingResponse,
	BookingSearchRequest,
	BookingUpdateRequest,
} from './bookings.apicontract';
import { BookingsService } from './bookings.service';
import { TimeslotsService } from '../timeslots/timeslots.service';
import { MOLAuth } from 'mol-lib-common';
import { MOLUserAuthLevel } from 'mol-lib-api-contract/auth/auth-forwarder/common/MOLUserAuthLevel';
import { BookingsMapper } from './bookings.mapper';
import { ApiData, ApiDataFactory, ApiPagedData } from '../../apicontract';
import { KoaContextStore } from '../../infrastructure/koaContextStore.middleware';
import { UserContext } from '../../infrastructure/auth/userContext';
import { Booking } from '../../models/entities';
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 100;

@Route('v1/bookings')
@Tags('Bookings')
export class BookingsController extends Controller {
	@Inject
	private bookingsService: BookingsService;
	@Inject
	private timeslotService: TimeslotsService;
	@Inject
	private _koaContextStore: KoaContextStore;
	@Inject
	private userContext: UserContext;

	/**
	 * Creates a new booking.
	 * [startDateTime, endDateTime] pair needs to match an available timeslot for the service or service provider.
	 * If serviceProviderId is specified, the booking status will be Accepted (2),
	 * otherwise the status will be Pending (1) and will require approval by an admin.
	 * @param bookingRequest
	 * @param @isInt serviceId The service (id) to be booked.
	 */
	@Post()
	@SuccessResponse(201, 'Created')
	@Security('service')
	@Response(401, 'Unauthorized')
	public async postBooking(
		@Body() bookingRequest: BookingRequest,
		@Header('x-api-service') serviceId: number,
	): Promise<ApiData<BookingResponse>> {
		const koaContext = this._koaContextStore.koaContext;

		bookingRequest.outOfSlotBooking = false;
		bookingRequest.captchaOrigin = koaContext.header.origin;
		const booking = await this.bookingsService.save(bookingRequest, serviceId);
		this.setStatus(201);
		return ApiDataFactory.create(BookingsMapper.mapDataModel(booking, await this.userContext.getCurrentUser()));
	}

	/**
	 * Creates a new booking. Any startDateTime and endDateTime are allowed.
	 * If serviceProviderId is specified, the booking status will be Accepted (2),
	 * otherwise the status will be Pending (1) and will require approval by an admin.
	 * @param bookingRequest
	 * @param @isInt serviceId The service (id) to be booked.
	 */
	@Post('admin')
	@SuccessResponse(201, 'Created')
	@Security('service')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async postBookingOutOfSlot(
		@Body() bookingRequest: BookingRequest,
		@Header('x-api-service') serviceId: number,
	): Promise<ApiData<BookingResponse>> {
		bookingRequest.outOfSlotBooking = true;
		const booking = await this.bookingsService.save(bookingRequest, serviceId);
		this.setStatus(201);
		return ApiDataFactory.create(BookingsMapper.mapDataModel(booking, await this.userContext.getCurrentUser()));
	}

	/**
	 * Approves a booking and allocates a service provider to it. The booking must have Pending (1) status and the service provider (serviceProviderId) must be available for this booking timeslot otherwise the request will fail.
	 * @param @isInt bookingId The booking id.
	 * @param rescheduleRequest A new booking request for reschedule
	 */
	@Post('{bookingId}/reschedule')
	@SuccessResponse(200, 'Accepted')
	@MOLAuth({ user: { minLevel: MOLUserAuthLevel.L2 } })
	@Response(401, 'Valid authentication types: [citizen]')
	public async reschedule(
		@Path() bookingId: number,
		@Body() rescheduleRequest: BookingRequest,
	): Promise<ApiData<BookingResponse>> {
		const koaContext = this._koaContextStore.koaContext;

		rescheduleRequest.outOfSlotBooking = false;
		rescheduleRequest.captchaOrigin = koaContext.header.origin;

		const rescheduledBooking = await this.bookingsService.reschedule(bookingId, rescheduleRequest, false);
		return ApiDataFactory.create(
			BookingsMapper.mapDataModel(rescheduledBooking, await this.userContext.getCurrentUser()),
		);
	}

	/**
	 * Approves a booking and allocates a service provider to it. The booking must have Pending (1) status and the service provider (serviceProviderId) must be available for this booking timeslot otherwise the request will fail.
	 * @param @isInt bookingId The booking id.
	 * @param acceptRequest
	 */
	@Post('{bookingId}/accept')
	@SuccessResponse(204, 'Accepted')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async acceptBooking(@Path() bookingId: number, @Body() acceptRequest: BookingAcceptRequest): Promise<void> {
		await this.bookingsService.acceptBooking(bookingId, acceptRequest);
	}

	/**
	 * Cancels a booking. Only future bookings that have Pending (1) or Accepted (2) status can be cancelled.
	 * @param @isInt bookingId The booking id.
	 */
	@Post('{bookingId}/cancel')
	@SuccessResponse(204, 'Cancelled')
	@MOLAuth({
		admin: {},
		agency: {},
		user: { minLevel: MOLUserAuthLevel.L2 },
	})
	@Response(401, 'Valid authentication types: [admin,agency,user]')
	public async cancelBooking(@Path() bookingId: number): Promise<void> {
		await this.bookingsService.cancelBooking(bookingId);
	}

	/**
	 * Updates an existing booking.
	 * It will delete the exisitng booking and re-create a new booking based on request data.
	 * @param @isInt bookingId The booking id.
	 * @param bookingRequest
	 * @param @isInt serviceId The service (id) to be booked.
	 */
	@Put('{bookingId}')
	@SuccessResponse(200, 'Updated')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async updateBooking(
		@Path() bookingId: number,
		@Body() bookingRequest: BookingUpdateRequest,
	): Promise<ApiData<BookingResponse>> {
		const booking = await this.bookingsService.update(bookingId, bookingRequest, true);
		return ApiDataFactory.create(BookingsMapper.mapDataModel(booking, await this.userContext.getCurrentUser()));
	}

	/**
	 * Retrieves all bookings that intercept the datetime range provided [from, to].
	 * @param from The lower bound datetime limit (inclusive) for booking's end time.
	 * @param to  The upper bound datetime limit (inclusive) for booking's start time.
	 * @param fromCreatedDate
	 * @param toCreatedDate
	 * @param @isInt status (Optional) filters by a list of status: Pending (1), Accepted (2), Cancelled (3).
	 * @param citizenUinFins (Optional) filters by a list of citizen ids
	 * @param @isInt serviceProviderIds
	 * @param @isInt serviceId (Optional) filters by a service (id).
	 * @param @isInt page
	 * @param @isInt limit
	 * @param maxId
	 */
	@Get('')
	@SuccessResponse(200, 'Ok')
	@Security('optional-service')
	@MOLAuth({
		admin: {},
		agency: {},
		user: { minLevel: MOLUserAuthLevel.L2 },
	})
	@Response(401, 'Valid authentication types: [admin,agency,user]')
	// tslint:disable-next-line: parameters-max-number
	public async getBookings(
		@Query() from?: Date,
		@Query() to?: Date,
		@Query() fromCreatedDate?: Date,
		@Query() toCreatedDate?: Date,
		@Query() status?: number[],
		@Query() citizenUinFins?: string[],
		@Query() serviceProviderIds?: number[],
		@Query() page?: number,
		@Query() limit?: number,
		@Query() maxId?: number,
		@Header('x-api-service') serviceId?: number,
	): Promise<ApiPagedData<BookingResponse>> {
		const searchQuery: BookingSearchRequest = {
			from,
			to,
			fromCreatedDate,
			toCreatedDate,
			statuses: status,
			serviceId,
			citizenUinFins,
			serviceProviderIds,
			page: page || DEFAULT_PAGE,
			limit: Math.min(limit || DEFAULT_LIMIT, DEFAULT_LIMIT),
			maxId,
		};

		const pagedBookings = await this.bookingsService.searchBookings(searchQuery);
		const currentUser = await this.userContext.getCurrentUser();
		return ApiDataFactory.createPaged(pagedBookings, (booking: Booking) => {
			return BookingsMapper.mapDataModel(booking, currentUser);
		});
	}

	/**
	 * Retrieves a single booking.
	 * @param @isInt bookingId The booking id.
	 */
	@Get('{bookingId}')
	@SuccessResponse(200, 'Ok')
	@MOLAuth({
		admin: {},
		agency: {},
		user: { minLevel: MOLUserAuthLevel.L2 },
	})
	@Response(401, 'Valid authentication types: [admin,agency,user]')
	public async getBooking(@Path() bookingId: number): Promise<ApiData<BookingResponse>> {
		const booking = await this.bookingsService.getBooking(bookingId);
		return ApiDataFactory.create(BookingsMapper.mapDataModel(booking, await this.userContext.getCurrentUser()));
	}

	/**
	 * Retrieves a list of available service providers for this booking timeslot.
	 * @param @isInt bookingId The booking id.
	 */
	@Get('{bookingId}/providers')
	@SuccessResponse(200, 'Ok')
	@MOLAuth({
		admin: {},
		agency: {},
		user: { minLevel: MOLUserAuthLevel.L2 },
	})
	@Response(401, 'Valid authentication types: [admin,agency,user]')
	public async getBookingProviders(@Path() bookingId: number): Promise<ApiData<BookingProviderResponse[]>> {
		const booking = await this.bookingsService.getBooking(bookingId);

		const providers = await this.timeslotService.getAvailableProvidersForTimeslot(
			booking.startDateTime,
			booking.endDateTime,
			booking.serviceId,
			true,
		);

		return ApiDataFactory.create(providers.map((e) => BookingsMapper.mapProvider(e.serviceProvider)));
	}

	/**
	 * Reject a booking request. Only Pending (1) bookings that can be rejected.
	 * @param @isInt bookingId The booking id.
	 */
	@Post('{bookingId}/reject')
	@SuccessResponse(200, 'Rejected')
	@MOLAuth({
		admin: {},
		agency: {},
	})
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async rejectBooking(@Path() bookingId: number): Promise<void> {
		await this.bookingsService.rejectBooking(bookingId);
	}

	/**
	 * Validates an on hold booking.
	 * It will add additional booking information to an existing booking and change the status of the booking
	 * @param bookingRequest
	 * @param @isInt bookingId The booking id.
	 */
	@Post('{bookingId}/validateOnHold')
	@SuccessResponse(200, 'Validated')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency,user]')
	public async validateOnHoldBooking(
		@Body() bookingRequest: BookingDetailsRequest,
		@Path() bookingId: number,
	): Promise<ApiData<BookingResponse>> {
		bookingRequest.outOfSlotBooking = false;
		const booking = await this.bookingsService.validateOnHoldBooking(bookingId, bookingRequest, true);
		return ApiDataFactory.create(BookingsMapper.mapDataModel(booking, await this.userContext.getCurrentUser()));
	}
}
