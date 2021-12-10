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
	Hidden,
	Tags,
} from 'tsoa';
import { MOLAuth } from 'mol-lib-common';
import { MOLUserAuthLevel } from 'mol-lib-api-contract/auth/auth-forwarder/common/MOLUserAuthLevel';
import { TimeslotsService } from '../timeslots/timeslots.service';
import {
	ApiData,
	ApiDataBulk,
	ApiDataFactory,
	ApiPagedData,
	ApiPagedDataV2,
	ApiPagingFactory,
	FailedRecord,
} from '../../apicontract';
import { KoaContextStore } from '../../infrastructure/koaContextStore.middleware';
import { Booking } from '../../models/entities';
import { BookingsMapper } from './bookings.mapper';
import { BookingsService } from './bookings.service';
import {
	BookingReject,
	BookingRequestV2,
	BookingResponseV2,
	BookingRequestV1,
	BookingAcceptRequestV2,
	BookingAcceptRequestV1,
	BookingUpdateRequestV2,
	BookingUpdateRequestV1,
	BookingSearchRequest,
	BookingResponseV1,
	BookingProviderResponseV1,
	BookingProviderResponseV2,
	BookingChangeUser,
	ValidateOnHoldRequest,
	SendBookingsToLifeSGRequest,
	BookingAuthType,
	BookingUUIDRequest,
} from './bookings.apicontract';
import { IdHasher } from '../../infrastructure/idHasher';
import { BookingSGAuth } from '../../infrastructure/decorators/bookingSGAuth';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 100;
const EXPORT_LIMIT = 5000;

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
	private bookingsMapper: BookingsMapper;
	@Inject
	private apiPagingFactory: ApiPagingFactory;
	@Inject
	private idHasher: IdHasher;

	/**
	 * Creates a new booking.
	 * [startDateTime, endDateTime] pair needs to match an available timeslot for the service or service provider.
	 * If serviceProviderId is specified, the booking status will be Accepted (2),
	 * otherwise the status will be Pending (1) and will require approval by an admin.
	 *
	 * @param bookingRequest
	 * @param @isInt serviceId The service (id) to be booked.
	 */
	@Post()
	@SuccessResponse(201, 'Created')
	@BookingSGAuth({ admin: {}, agency: {}, user: { minLevel: MOLUserAuthLevel.L2 }, anonymous: true, otp: true })
	@Security('service')
	@Response(401, 'Valid authentication types: [admin,agency,user,anonymous]')
	public async postBooking(
		@Body() bookingRequest: BookingRequestV1,
		@Header('x-api-service') serviceId: number,
	): Promise<ApiData<BookingResponseV1>> {
		const booking = await this.bookingsService.save(bookingRequest, serviceId);
		this.setStatus(201);
		return ApiDataFactory.create(await this.bookingsMapper.mapDataModelV1(booking, { mapUUID: true }));
	}

	@Post('bulk')
	@SuccessResponse(201, 'Created')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async postBookings(
		@Body() bookingRequests: BookingRequestV1[],
		@Header('x-api-service') serviceId: number,
	): Promise<ApiDataBulk<BookingResponseV1[], any[]>> {
		const failedBookings: FailedRecord<BookingRequestV1, any>[] = [];
		const bookings: Booking[] = [];

		for (const bookingRequest of bookingRequests) {
			try {
				bookings.push(await this.bookingsService.save(bookingRequest, serviceId, true));
			} catch (error) {
				failedBookings.push(new FailedRecord(bookingRequest, error.message));
			}
		}

		this.setStatus(201);
		return ApiDataFactory.createBulk(await this.bookingsMapper.mapDataModelsV1(bookings), failedBookings);
	}

	/**
	 * Creates a new booking. Any startDateTime and endDateTime are allowed.
	 * If serviceProviderId is specified, the booking status will be Accepted (2),
	 * otherwise the status will be Pending (1) and will require approval by an admin.
	 *
	 * @param bookingRequest
	 * @param @isInt serviceId The service (id) to be booked.
	 */
	@Post('admin')
	@SuccessResponse(201, 'Created')
	@Security('service')
	@BookingSGAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async postBookingOutOfSlot(
		@Body() bookingRequest: BookingRequestV1,
		@Header('x-api-service') serviceId: number,
	): Promise<ApiData<BookingResponseV1>> {
		const booking = await this.bookingsService.save(bookingRequest, serviceId);
		this.setStatus(201);
		return ApiDataFactory.create(await this.bookingsMapper.mapDataModelV1(booking, { mapUUID: true }));
	}

	/**
	 * Approves a booking and allocates a service provider to it. The booking must have Pending (1) status and the service provider (serviceProviderId) must be available for this booking timeslot otherwise the request will fail.
	 *
	 * @param @isInt bookingId The booking id.
	 * @param rescheduleRequest A new booking request for reschedule
	 */
	@Post('{bookingId}/reschedule')
	@BookingSGAuth({ admin: {}, agency: {}, user: { minLevel: MOLUserAuthLevel.L2 }, otp: true })
	@SuccessResponse(200, 'Accepted')
	@Response(401, 'Valid authentication types: [admin,agency,user,anonymous-otp]')
	public async reschedule(
		@Path() bookingId: number,
		@Body() rescheduleRequest: BookingUpdateRequestV1,
	): Promise<ApiData<BookingResponseV1>> {
		const rescheduledBooking = await this.bookingsService.reschedule(bookingId, rescheduleRequest);
		return ApiDataFactory.create(await this.bookingsMapper.mapDataModelV1(rescheduledBooking, { mapUUID: true }));
	}

	/**
	 * Approves a booking and allocates a service provider to it. The booking must have Pending (1) status and the service provider (serviceProviderId) must be available for this booking timeslot otherwise the request will fail.
	 *
	 * @param @isInt bookingId The booking id.
	 * @param acceptRequest
	 */
	@Post('{bookingId}/accept')
	@SuccessResponse(204, 'Accepted')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async acceptBooking(
		@Path() bookingId: number,
		@Body() acceptRequest: BookingAcceptRequestV1,
	): Promise<void> {
		await this.bookingsService.acceptBooking(bookingId, acceptRequest);
	}

	/**
	 * Cancels a booking. Only future bookings that have Pending (1) or Accepted (2) status can be cancelled.
	 *
	 * @param @isInt bookingId The booking id.
	 */
	@Post('{bookingId}/cancel')
	@BookingSGAuth({ admin: {}, agency: {}, user: { minLevel: MOLUserAuthLevel.L2 }, otp: true })
	@SuccessResponse(204, 'Cancelled')
	@Response(401, 'Valid authentication types: [admin,agency,user,anonymous-otp]')
	public async cancelBooking(@Path() bookingId: number): Promise<void> {
		await this.bookingsService.cancelBooking(bookingId);
	}

	/**
	 * Updates the booking user with the current user. It requires a Booking UUID
	 *
	 * @param @isInt bookingId The booking id.
	 */
	@Post('{bookingId}/user')
	@BookingSGAuth({ admin: {}, agency: {}, user: { minLevel: MOLUserAuthLevel.L2 }, otp: true })
	@SuccessResponse(200, 'Ok')
	@Response(401, 'Valid authentication types: [admin,agency,user,anonymous-otp]')
	public async changeUser(
		@Path() bookingId: number,
		@Body() request: BookingChangeUser,
	): Promise<ApiData<BookingResponseV1>> {
		request.bookingId = bookingId;
		const booking = await this.bookingsService.changeUser(request);
		return ApiDataFactory.create(await this.bookingsMapper.mapDataModelV1(booking, { mapUUID: true }));
	}

	/**
	 * Updates an existing booking.
	 * It will delete the exisitng booking and re-create a new booking based on request data.
	 *
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
		@Body() bookingRequest: BookingUpdateRequestV1,
	): Promise<ApiData<BookingResponseV1>> {
		const booking = await this.bookingsService.update(bookingId, bookingRequest);
		return ApiDataFactory.create(await this.bookingsMapper.mapDataModelV1(booking));
	}

	/**
	 * Retrieves all booking according to filter and returns bookign results as CSV.
	 *
	 * @param from (Optional) The lower bound datetime limit (inclusive) for booking's end time.
	 * @param to (Optional) The upper bound datetime limit (inclusive) for booking's start time.
	 * @param fromCreatedDate (Optional)
	 * @param toCreatedDate (Optional)
	 * @param @isInt status (Optional) filters by a list of status: Pending (1), Accepted (2), Cancelled (3).
	 * @param citizenUinFins (Optional) filters by a list of citizen ids
	 * @param @isInt serviceProviderIds (Optional)
	 * @param @isInt serviceId (Optional) filters by a service (id).
	 * @param @isInt page (Optional)
	 * @param @isInt limit (Optional)
	 * @param maxId (Optional)
	 */
	@Get('csv')
	@SuccessResponse(200, 'Ok')
	@Security('optional-service')
	@MOLAuth({
		admin: {},
		agency: {},
	})
	@Response(401, 'Valid authentication types: [admin,agency]')
	// tslint:disable-next-line: parameters-max-number
	public async getBookingsCSV(
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
	): Promise<void> {
		if (!status) {
			status = this.bookingsMapper.mapStatuses();
		}
		await this.bookingsService.checkLimit(limit, EXPORT_LIMIT);
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
			limit,
			maxId,
		};

		const bookings = await this.bookingsService.searchBookingsReturnAll(searchQuery);

		const bookingsCSVContent = await this.bookingsMapper.mapBookingsCSV(bookings);
		const koaContext = this._koaContextStore.koaContext;
		koaContext.body = bookingsCSVContent;

		koaContext.set('Content-Type', 'text/csv');
		koaContext.set('Content-Disposition', `attachment; filename="exported-bookings.csv"`);
		this._koaContextStore.manualContext = true;
	}

	/**
	 * Retrieves all bookings that intercept the datetime range provided [from, to].
	 *
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
	 * @param eventIds
	 * @param bookingToken
	 */
	@Get('')
	@BookingSGAuth({ admin: {}, agency: {}, user: { minLevel: MOLUserAuthLevel.L2 }, otp: true })
	@SuccessResponse(200, 'Ok')
	@Security('optional-service')
	@Response(401, 'Valid authentication types: [admin,agency,user,anonymous-otp]')
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
		@Query() eventIds: string[] = [],
		@Query() bookingToken?: string,
		@Header('x-api-service') serviceId?: number,
	): Promise<ApiPagedData<BookingResponseV1>> {
		if (!status) {
			status = this.bookingsMapper.mapStatuses();
		}

		const unsignedEventIds = [];
		for (const id of eventIds) {
			unsignedEventIds.push(this.idHasher.decode(id));
		}
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
			eventIds: unsignedEventIds,
			bookingToken,
		};

		const pagedBookings = await this.bookingsService.searchBookings(searchQuery);
		return this.apiPagingFactory.createPagedAsync(pagedBookings, async (booking: Booking) => {
			return await this.bookingsMapper.mapDataModelV1(booking);
		});
	}

	/**
	 * Retrieves a single booking.
	 *
	 * @param @isInt bookingId The booking id.
	 */
	@Get('{bookingId}')
	@BookingSGAuth({ admin: {}, agency: {}, user: { minLevel: MOLUserAuthLevel.L2 }, otp: true })
	@SuccessResponse(200, 'Ok')
	@Response(401, 'Valid authentication types: [admin,agency,user,anonymous-otp]')
	public async getBooking(@Path() bookingId: number | string): Promise<ApiData<BookingResponseV1>> {
		if (typeof bookingId === 'string') {
			bookingId = this.idHasher.decode(bookingId);
		}
		const booking = await this.bookingsService.getBooking(bookingId);
		return ApiDataFactory.create(await this.bookingsMapper.mapDataModelV1(booking));
	}

	/**
	 * Retrieves a list of available service providers for this booking timeslot.
	 *
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
	public async getBookingProviders(@Path() bookingId: number): Promise<ApiData<BookingProviderResponseV1[]>> {
		const booking = await this.bookingsService.getBooking(bookingId);

		const providers = await this.timeslotService.getAvailableProvidersForTimeslot({
			startDateTime: booking.startDateTime,
			endDateTime: booking.endDateTime,
			serviceId: booking.serviceId,
			skipUnassigned: true,
			filterDaysInAdvance: false,
		});

		return ApiDataFactory.create(providers.map((e) => this.bookingsMapper.mapProviderV1(e.serviceProvider)));
	}

	/**
	 * Reject a booking request. Only Pending (1) bookings that can be rejected.
	 *
	 * @param @isInt bookingId The booking id.
	 */
	@Post('{bookingId}/reject')
	@SuccessResponse(200, 'Rejected')
	@MOLAuth({
		admin: {},
		agency: {},
	})
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async rejectBooking(@Path() bookingId: number, @Body() bookingReject: BookingReject): Promise<void> {
		await this.bookingsService.rejectBooking(bookingId, bookingReject);
	}

	/**
	 * Validates an on hold booking.
	 * It will add additional booking information to an existing booking and change the status of the booking
	 *
	 * @param bookingRequest
	 * @param @isInt bookingId The booking id.
	 */
	@Post('{bookingId}/validateOnHold')
	@BookingSGAuth({ admin: {}, agency: {}, user: { minLevel: MOLUserAuthLevel.L2 }, otp: true })
	@SuccessResponse(200, 'Validated')
	@Response(401, 'Valid authentication types: [admin,agency,user,anonymous-otp]')
	public async validateOnHoldBooking(
		@Body() bookingRequest: ValidateOnHoldRequest,
		@Path() bookingId: number,
	): Promise<ApiData<BookingResponseV1>> {
		const booking = await this.bookingsService.validateOnHoldBooking(bookingId, bookingRequest);
		return ApiDataFactory.create(await this.bookingsMapper.mapDataModelV1(booking));
	}
}

@Route('v2/bookings')
@Tags('Bookings')
export class BookingsControllerV2 extends Controller {
	@Inject
	private bookingsService: BookingsService;
	@Inject
	private timeslotService: TimeslotsService;
	@Inject
	private _koaContextStore: KoaContextStore;
	@Inject
	private bookingsMapper: BookingsMapper;
	@Inject
	private idHasher: IdHasher;
	@Inject
	private apiPagingFactory: ApiPagingFactory;

	/**
	 * Creates a new booking.
	 * [startDateTime, endDateTime] pair needs to match an available timeslot for the service or service provider.
	 * If serviceProviderId is specified, the booking status will be Accepted (2),
	 * otherwise the status will be Pending (1) and will require approval by an admin.
	 *
	 * @param bookingRequest
	 * @param serviceId The service (id) to be booked.
	 */
	@Post()
	@SuccessResponse(201, 'Created')
	@BookingSGAuth({ admin: {}, agency: {}, user: { minLevel: MOLUserAuthLevel.L2 }, anonymous: true, otp: true })
	@Security('service')
	@Response(401, 'Valid authentication types: [admin,agency,user,anonymous]')
	public async postBooking(
		@Body() bookingRequest: BookingRequestV2,
		@Header('x-api-service') serviceId: string,
	): Promise<ApiData<BookingResponseV2>> {
		const unsignedServiceId = this.idHasher.decode(serviceId);
		const unsignedServiceProviderId = this.idHasher.decode(bookingRequest.serviceProviderId);
		const request: BookingRequestV1 = { ...bookingRequest, serviceProviderId: unsignedServiceProviderId };

		const booking = await this.bookingsService.save(request, unsignedServiceId);
		this.setStatus(201);
		return ApiDataFactory.create(await this.bookingsMapper.mapDataModelV2(booking, { mapUUID: true }));
	}

	@Post('bulk')
	@SuccessResponse(201, 'Created')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async postBookings(
		@Body() bookingRequests: BookingRequestV2[],
		@Header('x-api-service') serviceId: string,
	): Promise<ApiDataBulk<BookingResponseV2[], any[]>> {
		const failedBookings: FailedRecord<BookingRequestV2, any>[] = [];
		const bookings: Booking[] = [];

		const unsignedServiceId = this.idHasher.decode(serviceId);

		for (const bookingRequest of bookingRequests) {
			const unsignedServiceProviderId = this.idHasher.decode(bookingRequest.serviceProviderId);
			const request: BookingRequestV1 = { ...bookingRequest, serviceProviderId: unsignedServiceProviderId };
			try {
				bookings.push(await this.bookingsService.save(request, unsignedServiceId, true));
			} catch (error) {
				failedBookings.push(new FailedRecord(bookingRequest, error.message));
			}
		}

		this.setStatus(201);
		return ApiDataFactory.createBulk(await this.bookingsMapper.mapDataModelsV2(bookings), failedBookings);
	}

	/**
	 * Creates a new booking. Any startDateTime and endDateTime are allowed.
	 * If serviceProviderId is specified, the booking status will be Accepted (2),
	 * otherwise the status will be Pending (1) and will require approval by an admin.
	 *
	 * @param bookingRequest
	 * @param serviceId The service (id) to be booked.
	 */
	@Post('admin')
	@SuccessResponse(201, 'Created')
	@Security('service')
	@BookingSGAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async postBookingOutOfSlot(
		@Body() bookingRequest: BookingRequestV2,
		@Header('x-api-service') serviceId: string,
	): Promise<ApiData<BookingResponseV2>> {
		const unsignedServiceId = this.idHasher.decode(serviceId);
		const unsignedServiceProviderId = this.idHasher.decode(bookingRequest.serviceProviderId);
		const request: BookingRequestV1 = { ...bookingRequest, serviceProviderId: unsignedServiceProviderId };

		const booking = await this.bookingsService.save(request, unsignedServiceId);
		this.setStatus(201);
		return ApiDataFactory.create(await this.bookingsMapper.mapDataModelV2(booking, { mapUUID: true }));
	}

	/**
	 * Approves a booking and allocates a service provider to it. The booking must have Pending (1) status and the service provider (serviceProviderId) must be available for this booking timeslot otherwise the request will fail.
	 *
	 * @param bookingId The booking id.
	 * @param rescheduleRequest A new booking request for reschedule
	 */
	@Post('{bookingId}/reschedule')
	@BookingSGAuth({ admin: {}, agency: {}, user: { minLevel: MOLUserAuthLevel.L2 }, otp: true })
	@SuccessResponse(200, 'Accepted')
	@Response(401, 'Valid authentication types: [admin,agency,user,anonymous-otp]')
	public async reschedule(
		@Path() bookingId: string,
		@Body() rescheduleRequest: BookingUpdateRequestV2,
	): Promise<ApiData<BookingResponseV2>> {
		const unsignedBookingId = this.idHasher.decode(bookingId);
		const unsignedServiceProviderId = this.idHasher.decode(rescheduleRequest.serviceProviderId);
		const request: BookingUpdateRequestV1 = { ...rescheduleRequest, serviceProviderId: unsignedServiceProviderId };

		const rescheduledBooking = await this.bookingsService.reschedule(unsignedBookingId, request);
		return ApiDataFactory.create(await this.bookingsMapper.mapDataModelV2(rescheduledBooking, { mapUUID: true }));
	}

	/**
	 * Approves a booking and allocates a service provider to it. The booking must have Pending (1) status and the service provider (serviceProviderId) must be available for this booking timeslot otherwise the request will fail.
	 *
	 * @param bookingId The booking id.
	 * @param acceptRequest
	 */
	@Post('{bookingId}/accept')
	@SuccessResponse(204, 'Accepted')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async acceptBooking(
		@Path() bookingId: string,
		@Body() acceptRequest: BookingAcceptRequestV2,
	): Promise<void> {
		const unsignedBookingId = this.idHasher.decode(bookingId);
		const unsignedServiceProviderId = this.idHasher.decode(acceptRequest.serviceProviderId);
		const request: BookingAcceptRequestV1 = { ...acceptRequest, serviceProviderId: unsignedServiceProviderId };
		await this.bookingsService.acceptBooking(unsignedBookingId, request);
	}

	/**
	 * Cancels a booking. Only future bookings that have Pending (1) or Accepted (2) status can be cancelled.
	 *
	 * @param bookingId The booking id.
	 */
	@Post('{bookingId}/cancel')
	@BookingSGAuth({ admin: {}, agency: {}, user: { minLevel: MOLUserAuthLevel.L2 }, otp: true })
	@SuccessResponse(204, 'Cancelled')
	@Response(401, 'Valid authentication types: [admin,agency,user,anonymous-otp]')
	public async cancelBooking(@Path() bookingId: string): Promise<void> {
		const unsignedBookingId = this.idHasher.decode(bookingId);
		await this.bookingsService.cancelBooking(unsignedBookingId);
	}

	/**
	 * Updates an existing booking.
	 * It will delete the exisitng booking and re-create a new booking based on request data.
	 *
	 * @param bookingId The booking id.
	 * @param bookingRequest
	 */
	@Put('{bookingId}')
	@SuccessResponse(200, 'Updated')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async updateBooking(
		@Path() bookingId: string,
		@Body() bookingRequest: BookingUpdateRequestV2,
	): Promise<ApiData<BookingResponseV2>> {
		const unsignedBookingId = this.idHasher.decode(bookingId);
		const unsignedServiceProviderId = this.idHasher.decode(bookingRequest.serviceProviderId);
		const request: BookingUpdateRequestV1 = { ...bookingRequest, serviceProviderId: unsignedServiceProviderId };
		const booking = await this.bookingsService.update(unsignedBookingId, request);
		return ApiDataFactory.create(await this.bookingsMapper.mapDataModelV2(booking));
	}

	/**
	 * Retrieves all booking according to filter and returns booking results as CSV.
	 *
	 * @param from (Optional) The lower bound datetime limit (inclusive) for booking's end time.
	 * @param to (Optional) The upper bound datetime limit (inclusive) for booking's start time.
	 * @param fromCreatedDate (Optional)
	 * @param toCreatedDate (Optional)
	 * @param @isInt status (Optional) filters by a list of status: Pending (1), Accepted (2), Cancelled (3).
	 * @param citizenUinFins (Optional) filters by a list of citizen ids
	 * @param serviceProviderIds (Optional)
	 * @param serviceId (Optional) filters by a service (id).
	 * @param @isInt page (Optional)
	 * @param @isInt limit (Optional)
	 * @param maxId (Optional)
	 */
	@Get('csv')
	@SuccessResponse(200, 'Ok')
	@Security('optional-service')
	@MOLAuth({
		admin: {},
		agency: {},
	})
	@Response(401, 'Valid authentication types: [admin,agency]')
	// tslint:disable-next-line: parameters-max-number
	public async getBookingsCSV(
		@Query() from?: Date,
		@Query() to?: Date,
		@Query() fromCreatedDate?: Date,
		@Query() toCreatedDate?: Date,
		@Query() status?: number[],
		@Query() citizenUinFins?: string[],
		@Query() serviceProviderIds: string[] = [],
		@Query() page?: number,
		@Query() limit?: number,
		@Query() maxId?: string,
		@Query() eventIds: string[] = [],
		@Header('x-api-service') serviceId?: string,
	): Promise<void> {
		if (!status) {
			status = this.bookingsMapper.mapStatuses();
		}
		await this.bookingsService.checkLimit(limit, EXPORT_LIMIT);

		const unsignedServiceId = this.idHasher.decode(serviceId);
		const spIds = [];
		for (const spId of serviceProviderIds) {
			const unsignedSpId = this.idHasher.decode(spId);
			spIds.push(unsignedSpId);
		}
		const unsignedEventIds = [];
		for (const eventId of eventIds) {
			const unsignedEventId = this.idHasher.decode(eventId);
			unsignedEventIds.push(unsignedEventId);
		}
		const searchQuery: BookingSearchRequest = {
			from,
			to,
			fromCreatedDate,
			toCreatedDate,
			statuses: status,
			serviceId: unsignedServiceId,
			citizenUinFins,
			serviceProviderIds: spIds,
			page: page || DEFAULT_PAGE,
			limit,
			maxId: this.idHasher.decode(maxId),
			eventIds: unsignedEventIds,
		};

		const bookings = await this.bookingsService.searchBookingsReturnAll(searchQuery);

		const bookingsCSVContent = await this.bookingsMapper.mapBookingsCSV(bookings);
		const koaContext = this._koaContextStore.koaContext;
		koaContext.body = bookingsCSVContent;

		koaContext.set('Content-Type', 'text/csv');
		koaContext.set('Content-Disposition', `attachment; filename="exported-bookings.csv"`);
		this._koaContextStore.manualContext = true;
	}

	/**
	 * Retrieves all bookings that intercept the datetime range provided [from, to].
	 *
	 * @param from The lower bound datetime limit (inclusive) for booking's end time.
	 * @param to  The upper bound datetime limit (inclusive) for booking's start time.
	 * @param fromCreatedDate
	 * @param toCreatedDate
	 * @param @isInt status (Optional) filters by a list of status: Pending (1), Accepted (2), Cancelled (3).
	 * @param citizenUinFins (Optional) filters by a list of citizen ids
	 * @param serviceProviderIds
	 * @param serviceId (Optional) filters by a service (id).
	 * @param @isInt page
	 * @param @isInt limit
	 * @param maxId
	 * @param eventIds
	 * @param bookingToken
	 */
	@Get('')
	@BookingSGAuth({ admin: {}, agency: {}, user: { minLevel: MOLUserAuthLevel.L2 }, otp: true })
	@SuccessResponse(200, 'Ok')
	@Security('optional-service')
	@Response(401, 'Valid authentication types: [admin,agency,user,anonymous-otp]')
	// tslint:disable-next-line: parameters-max-number
	public async getBookings(
		@Query() from?: Date,
		@Query() to?: Date,
		@Query() fromCreatedDate?: Date,
		@Query() toCreatedDate?: Date,
		@Query() status?: number[],
		@Query() citizenUinFins?: string[],
		@Query() serviceProviderIds: string[] = [],
		@Query() page?: number,
		@Query() limit?: number,
		@Query() maxId?: string,
		@Query() eventIds: string[] = [],
		@Query() bookingToken?: string,
		@Header('x-api-service') serviceId?: string,
	): Promise<ApiPagedDataV2<BookingResponseV2>> {
		if (!status) {
			status = this.bookingsMapper.mapStatuses();
		}

		const unsignedServiceId = this.idHasher.decode(serviceId);
		const spIds = [];
		for (const spId of serviceProviderIds) {
			const unsignedSpId = this.idHasher.decode(spId);
			spIds.push(unsignedSpId);
		}
		const unsignedEventIds = [];
		for (const eventId of eventIds) {
			const unsignedEventId = this.idHasher.decode(eventId);
			unsignedEventIds.push(unsignedEventId);
		}
		const searchQuery: BookingSearchRequest = {
			from,
			to,
			fromCreatedDate,
			toCreatedDate,
			statuses: status,
			serviceId: unsignedServiceId,
			citizenUinFins,
			serviceProviderIds: spIds,
			page: page || DEFAULT_PAGE,
			limit: Math.min(limit || DEFAULT_LIMIT, DEFAULT_LIMIT),
			maxId: this.idHasher.decode(maxId),
			eventIds: unsignedEventIds,
			bookingToken,
		};

		const pagedBookings = await this.bookingsService.searchBookings(searchQuery);
		return this.apiPagingFactory.createPagedV2Async(pagedBookings, async (booking: Booking) => {
			return await this.bookingsMapper.mapDataModelV2(booking);
		});
	}

	/**
	 * Retrieves a single booking.
	 *
	 * @param bookingId The booking id.
	 */
	@Get('{bookingId}')
	@BookingSGAuth({ admin: {}, agency: {}, user: { minLevel: MOLUserAuthLevel.L2 }, otp: true })
	@SuccessResponse(200, 'Ok')
	@Response(401, 'Valid authentication types: [admin,agency,user,anonymous-otp]')
	public async getBooking(@Path() bookingId: string): Promise<ApiData<BookingResponseV2>> {
		const unsignedBookingId = this.idHasher.decode(bookingId);
		const booking = await this.bookingsService.getBooking(unsignedBookingId);
		return ApiDataFactory.create(await this.bookingsMapper.mapDataModelV2(booking));
	}

	// TO REVIEW after all backward compatibility issues with owner ID is fixed
	/**
	 * THIS IS A TARGETED API for BACKWARD COMPATIBILITY for EXISTING BOOKINGS WITHOUT VALID OWNERID
	 * Retrieves a single booking by UUID and return only citizenAuthType
	 *
	 * @param bookingUUID Booking UUID
	 * @returns A single booking with only citizenAuthType
	 */
	@Post('authType')
	@Hidden()
	@BookingSGAuth({ bypassAuth: true })
	@SuccessResponse(200, 'Ok')
	public async getBookingByUUID(@Body() bookingUUIDRequest: BookingUUIDRequest): Promise<ApiData<BookingAuthType>> {
		const booking = await this.bookingsService.getBookingByUUID(bookingUUIDRequest.bookingUUID);
		return ApiDataFactory.create(this.bookingsMapper.mapBookingAuthType(booking));
	}

	/**
	 * Retrieves a list of available service providers for this booking timeslot.
	 *
	 * @param bookingId The booking id.
	 */
	@Get('{bookingId}/providers')
	@SuccessResponse(200, 'Ok')
	@MOLAuth({
		admin: {},
		agency: {},
		user: { minLevel: MOLUserAuthLevel.L2 },
	})
	@Response(401, 'Valid authentication types: [admin,agency,user]')
	public async getBookingProviders(@Path() bookingId: string): Promise<ApiData<BookingProviderResponseV2[]>> {
		const unsignedBookingId = this.idHasher.decode(bookingId);
		const booking = await this.bookingsService.getBooking(unsignedBookingId);

		const providers = await this.timeslotService.getAvailableProvidersForTimeslot({
			startDateTime: booking.startDateTime,
			endDateTime: booking.endDateTime,
			serviceId: booking.serviceId,
			skipUnassigned: true,
			filterDaysInAdvance: false,
		});

		return ApiDataFactory.create(providers.map((e) => this.bookingsMapper.mapProviderV2(e.serviceProvider)));
	}

	/**
	 * Reject a booking request. Only Pending (1) bookings that can be rejected.
	 *
	 * @param bookingId The booking id.
	 * @param bookingReject The reason for rejecting booking.
	 */
	@Post('{bookingId}/reject')
	@SuccessResponse(200, 'Rejected')
	@MOLAuth({
		admin: {},
		agency: {},
	})
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async rejectBooking(@Path() bookingId: string, @Body() bookingReject: BookingReject): Promise<void> {
		const unsignedBookingId = this.idHasher.decode(bookingId);
		await this.bookingsService.rejectBooking(unsignedBookingId, bookingReject);
	}

	/**
	 * Updates the booking user with the current user. It requires a Booking UUID
	 *
	 * @param @isInt bookingId The booking id.
	 */
	@Post('{bookingId}/user')
	@BookingSGAuth({ admin: {}, agency: {}, user: { minLevel: MOLUserAuthLevel.L2 }, otp: true })
	@SuccessResponse(200, 'Ok')
	@Response(401, 'Valid authentication types: [admin,agency,user,anonymous-otp]')
	public async changeUser(
		@Path() bookingId: string,
		@Body() request: BookingChangeUser,
	): Promise<ApiData<BookingResponseV2>> {
		request.bookingId = this.idHasher.decode(bookingId);
		const booking = await this.bookingsService.changeUser(request);
		return ApiDataFactory.create(await this.bookingsMapper.mapDataModelV2(booking, { mapUUID: true }));
	}

	/**
	 * Validates an on hold booking.
	 * It will add additional booking information to an existing booking and change the status of the booking
	 *
	 * @param bookingRequest
	 * @param bookingId The booking id.
	 */
	@Post('{bookingId}/validateOnHold')
	@BookingSGAuth({ admin: {}, agency: {}, user: { minLevel: MOLUserAuthLevel.L2 }, otp: true })
	@SuccessResponse(200, 'Validated')
	@Response(401, 'Valid authentication types: [admin,agency,user,anonymous-otp]')
	public async validateOnHoldBooking(
		@Body() bookingRequest: ValidateOnHoldRequest,
		@Path() bookingId: string,
	): Promise<ApiData<BookingResponseV2>> {
		const unsignedBookingId = this.idHasher.decode(bookingId);
		const booking = await this.bookingsService.validateOnHoldBooking(unsignedBookingId, bookingRequest);
		return ApiDataFactory.create(await this.bookingsMapper.mapDataModelV2(booking));
	}

	/**
	 * Migrates HDB VC bookings to LifeSG.
	 * It will get a list of future HDB VC bookings and send it to LifeSG MQ
	 */
	@Post('lifesg')
	@BookingSGAuth({ admin: {}, agency: {} })
	@SuccessResponse(200, 'Ok')
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async sendBookingsToLifeSG(@Body() request: SendBookingsToLifeSGRequest): Promise<any> {
		const result = await this.bookingsService.sendBookingsToLifeSG(request);
		return result;
	}
}
