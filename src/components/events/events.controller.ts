import {
	Body,
	Controller,
	Delete,
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
import { Inject } from 'typescript-ioc';
import { ApiData, ApiDataFactory, ApiPagingFactory, ApiPagedData } from '../../apicontract';
import { EventRequest, EventResponse } from './events.apicontract';
import { EventsService } from './events.service';
import { EventsMapper } from './events.mapper';
import { IdHasher } from '../../infrastructure/idHasher';
import { MOLAuth } from 'mol-lib-common';
import { Booking, Event } from '../../models';
import { MOLUserAuthLevel } from 'mol-lib-api-contract/auth/auth-forwarder/common/MOLUserAuthLevel';
import { BookingSearchRequest, EventBookingRequest, EventBookingResponse } from '../bookings/bookings.apicontract';
import { BookingsService } from '../bookings';
import { BookingsMapper } from '../bookings/bookings.mapper';
import { UserContext } from '../../infrastructure/auth/userContext';
import { BookingSGAuth } from '../../infrastructure/decorators/bookingSGAuth';
import { LabelOperationFiltering } from '../labels/label.enum';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 100;

@Route('v1/events')
@Tags('Events')
export class EventsController extends Controller {
	@Inject
	private eventsService: EventsService;
	@Inject
	private eventsMapper: EventsMapper;
	@Inject
	private idHasher: IdHasher;
	@Inject
	private bookingsService: BookingsService;
	@Inject
	private bookingsMapper: BookingsMapper;
	@Inject
	private userContext: UserContext;
	@Inject
	private apiPagingFactory: ApiPagingFactory;

	/**
	 * Retrieves events
	 *
	 * @param serviceId
	 * @param labelIds (Optional) to filter by label
	 * @param labelTypeOfFiltering (Optional) type of filtering "union" or "intersection" (default: intersection)
	 */
	@Get('')
	@Security('service')
	@MOLAuth({ admin: {}, agency: {}, user: { minLevel: MOLUserAuthLevel.L2 } })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async search(
		@Header('x-api-service') serviceId: string,
		@Query() page?: number,
		@Query() limit?: number,
		@Query() maxId?: number,
		@Query() labelIds?: string[],
		@Query() labelOperationFiltering?: LabelOperationFiltering,
	): Promise<ApiPagedData<EventResponse>> {
		const labelIdsNumber = labelIds && labelIds.length > 0 ? labelIds.map((id) => this.idHasher.decode(id)) : [];

		const pagedEvents = await this.eventsService.search({
			serviceId: this.idHasher.decode(serviceId),
			page: page || DEFAULT_PAGE,
			limit: Math.min(limit || DEFAULT_LIMIT, DEFAULT_LIMIT),
			maxId,
			labelIds: labelIdsNumber,
			labelOperationFiltering,
		});
		return this.apiPagingFactory.createPagedAsync(pagedEvents, async (event: Event) => {
			const eventBookings = await this.bookingsService.searchBookings({
				eventId: event.id,
				byPassAuth: true,
				page: page || DEFAULT_PAGE,
				limit: Math.min(limit || DEFAULT_LIMIT, DEFAULT_LIMIT),
				maxId,
			});
			const availableSlots = Math.max(0, event.capacity - eventBookings.entries.length);
			return await this.eventsMapper.mapToResponse(event, availableSlots);
		});
	}

	/**
	 * Retrieves specific event
	 *
	 */
	@Get('{eventId}')
	@Security('service')
	@MOLAuth({ admin: {}, agency: {}, user: { minLevel: MOLUserAuthLevel.L2 } })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async searchById(@Path() eventId: string): Promise<ApiData<EventResponse>> {
		const idUnsigned = this.idHasher.decode(eventId);
		const event = await this.eventsService.getById(idUnsigned);
		return ApiDataFactory.create(this.eventsMapper.mapToResponse(event));
	}
	/**
	 * Create an event
	 *
	 * @param request Details of the event to be created.
	 */
	@Post()
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async post(@Body() eventRequest: EventRequest): Promise<ApiData<EventResponse>> {
		const event = await this.eventsService.saveEvent(eventRequest);
		this.setStatus(201);
		return ApiDataFactory.create(this.eventsMapper.mapToResponse(event));
	}

	/**
	 * Update an event
	 */
	@Put('{id}')
	@SuccessResponse(201, 'Updated')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async update(@Path() id: string, @Body() eventRequest: EventRequest): Promise<ApiData<EventResponse>> {
		const event = await this.eventsService.updateEvent(eventRequest, id);
		this.setStatus(201);
		return ApiDataFactory.create(this.eventsMapper.mapToResponse(event));
	}

	/**
	 * Delete an event
	 *
	 * @param id The ID of the one-off timeslot to be deleted.
	 */
	@Delete('{id}')
	@SuccessResponse(204, 'Deleted')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async delete(@Path() id: string): Promise<void> {
		const idNotSighed = this.idHasher.decode(id);
		await this.eventsService.deleteById(idNotSighed);
	}

	/**
	 * Book an event, as citizen / admin / agency
	 * For citizen, validate captcha
	 *
	 * @param eventId Event ID for which the booking is made.
	 */
	@Post('{eventId}/bookings')
	@Response(401, 'Valid authentication types: [citizen,admin,agency]')
	@BookingSGAuth({ admin: {}, agency: {}, user: { minLevel: MOLUserAuthLevel.L2 }, anonymous: { requireOtp: false } })
	public async createEventBooking(
		@Path() eventId: string,
		@Body() eventBookingRequest: EventBookingRequest,
	): Promise<ApiData<EventBookingResponse>> {
		const eventIdNotSighed = this.idHasher.decode(eventId);
		const eventBooking = await this.bookingsService.bookAnEvent(eventBookingRequest, eventIdNotSighed, false);

		this.setStatus(201);
		return ApiDataFactory.create(await this.bookingsMapper.mapEventsDataModel(eventBooking));
	}

	/**
	 * Retrieves multiple bookings.
	 *
	 * @param @isInt eventId The event id.
	 */
	@Get('{eventId}/bookings')
	@SuccessResponse(200, 'Ok')
	@Response(401, 'Unauthorized')
	@BookingSGAuth({ admin: {}, agency: {}, user: { minLevel: MOLUserAuthLevel.L2 }, anonymous: { requireOtp: false } })
	public async getBookings(
		@Path() eventId: string,
		@Query() page?: number,
		@Query() limit?: number,
		@Query() maxId?: number,
	): Promise<ApiPagedData<EventBookingResponse>> {
		const idNotSigned = this.idHasher.decode(eventId);
		const searchRequest: BookingSearchRequest = {
			eventId: idNotSigned,
			page: page || DEFAULT_PAGE,
			limit: Math.min(limit || DEFAULT_LIMIT, DEFAULT_LIMIT),
			maxId,
		};
		const pagedBookings = await this.bookingsService.searchBookings(searchRequest);
		await this.userContext.getSnapshot();
		return this.apiPagingFactory.createPagedAsync(pagedBookings, async (booking: Booking) => {
			return this.bookingsMapper.mapEventsDataModel(booking);
		});
	}
}
