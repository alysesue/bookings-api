import { ErrorCodeV2, MOLErrorV2 } from "mol-lib-api-contract";
import { Inject, InRequestScope } from "typescript-ioc";
import { Booking, BookingStatus, ServiceProvider } from "../../models";
import { BookingsRepository } from "./bookings.repository";
import { BookingAcceptRequest, BookingRequest, BookingSearchRequest } from "./bookings.apicontract";
import { TimeslotsService } from '../timeslots/timeslots.service';
import { CalendarsService } from '../calendars/calendars.service';
import { DateHelper } from "../../infrastructure/dateHelper";
import { ServiceProvidersRepository } from "../serviceProviders/serviceProviders.repository";
import { UnavailabilitiesService } from "../unavailabilities/unavailabilities.service";
import { UserContext } from "../../infrastructure/userContext.middleware";
import { QueryAccessType } from "../../core/repository";
import { ChangeLogAction } from "../../models/entities/bookingChangeLog";
import { ServicesService } from "../services/services.service";
import { BookingChangeLogsService } from "../bookingChangeLogs/bookingChangeLogs.service";

@InRequestScope
export class BookingsService {
	@Inject
	public unavailabilitiesService: UnavailabilitiesService;
	@Inject
	private bookingsRepository: BookingsRepository;
	@Inject
	private calendarsService: CalendarsService;
	@Inject
	private timeslotsService: TimeslotsService;
	@Inject
	private serviceProviderRepo: ServiceProvidersRepository;
	@Inject
	private servicesService: ServicesService;
	@Inject
	private changeLogsService: BookingChangeLogsService;
	@Inject
	private userContext: UserContext;

	public formatEventId(event: string): string {
		return event.split("@")[0];
	}

	public async getBooking(bookingId: number): Promise<Booking> {
		const booking = await this.bookingsRepository.getBooking(bookingId);
		if (!booking) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage(`Booking ${bookingId} not found`);
		}
		return booking;
	}

	public async save(bookingRequest: BookingRequest, serviceId: number): Promise<Booking> {
		// Potential improvement: each [serviceId, bookingRequest.startDateTime, bookingRequest.endDateTime] save method call should be executed serially.
		// Method calls with different services, or timeslots should still run in parallel.
		const createAction = (_booking) => this.createBooking(bookingRequest, serviceId);
		return await this.changeLogsService.executeAndLogAction(null, createAction);
	}

	public async cancelBooking(bookingId: number): Promise<Booking> {
		const booking = await this.getBooking(bookingId);
		return await this.changeLogsService.executeAndLogAction(booking, this.cancelBookingInternal.bind(this));
	}

	private async cancelBookingInternal(booking: Booking): Promise<[ChangeLogAction, Booking]> {
		if (booking.status === BookingStatus.Cancelled || booking.startDateTime < new Date()) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(`Booking ${booking.id} is in invalid state for cancelling`);
		}

		const eventCalId = booking.eventICalId;
		if (booking.status === BookingStatus.Accepted) {
			const provider = await this.serviceProviderRepo.getServiceProvider({ id: booking.serviceProviderId });
			if (!provider) {
				throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(`Service provider '${booking.serviceProviderId}' not found`);
			}
			await this.calendarsService.deleteCalendarEvent(provider.calendar, this.formatEventId(eventCalId));
		}
		booking.status = BookingStatus.Cancelled;
		await this.bookingsRepository.update(booking);

		return [ChangeLogAction.Cancel, booking];
	}

	public async acceptBooking(bookingId: number, acceptRequest: BookingAcceptRequest): Promise<Booking> {
		const booking = await this.getBooking(bookingId);
		const acceptAction = (_booking) => this.acceptBookingInternal(_booking, acceptRequest);
		return await this.changeLogsService.executeAndLogAction(booking, acceptAction);
	}

	private async acceptBookingInternal(booking: Booking, acceptRequest: BookingAcceptRequest): Promise<[ChangeLogAction, Booking]> {
		if (booking.status !== BookingStatus.PendingApproval) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(`Booking ${booking.id} is in invalid state for accepting`);
		}

		const provider = await this.serviceProviderRepo.getServiceProvider({ id: acceptRequest.serviceProviderId });
		if (!provider) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(`Service provider '${acceptRequest.serviceProviderId}' not found`);
		}

		const timeslotEntry = await this.timeslotsService.getAvailableProvidersForTimeslot(booking.startDateTime, booking.endDateTime, booking.serviceId);
		const isProviderAvailable = timeslotEntry.availableServiceProviders.filter(e => e.id === acceptRequest.serviceProviderId).length > 0;
		if (!isProviderAvailable) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(`Service provider '${acceptRequest.serviceProviderId}' is not available for this booking.`);
		}

		const eventICalId = await this.calendarsService.createCalendarEvent(booking, provider.calendar);

		booking.status = BookingStatus.Accepted;
		booking.serviceProvider = provider;
		booking.eventICalId = eventICalId;

		await this.bookingsRepository.update(booking);

		return [ChangeLogAction.Accept, booking];
	}

	public async searchBookings(searchRequest: BookingSearchRequest): Promise<Booking[]> {
		return await this.bookingsRepository.search({ ...searchRequest, accessType: QueryAccessType.Read });
	}

	private async createBooking(bookingRequest: BookingRequest, serviceId: number): Promise<[ChangeLogAction, Booking]> {
		const duration = Math.floor(DateHelper.DiffInMinutes(bookingRequest.endDateTime, bookingRequest.startDateTime));
		if (duration <= 0) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('End time for booking must be greater than start time');
		}

		const serviceProvider = await this.serviceProviderRepo.getServiceProvider({ id: bookingRequest.serviceProviderId });
		if (bookingRequest.serviceProviderId && !serviceProvider) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(`Service provider '${bookingRequest.serviceProviderId}' not found`);
		}

		const booking = Booking.create(
			serviceId,
			bookingRequest.startDateTime,
			bookingRequest.endDateTime,
			bookingRequest.serviceProviderId,
			bookingRequest.refId
		);
		booking.serviceProvider = serviceProvider;
		booking.service = await this.servicesService.getService(serviceId);

		const user = await this.userContext.getCurrentUser();
		if (user.isCitizen()) {
			booking.citizenUinFin = user.singPassUser.UinFin;
		}

		booking.eventICalId = await this.getEventICalId(booking, serviceProvider);

		if (!bookingRequest.outOfSlotBooking) {
			await this.validateTimeSlot(booking);
		} else {
			await this.validateOutOfSlotBookings(booking);
		}

		await this.bookingsRepository.save(booking);

		return [ChangeLogAction.Create, booking];
	}

	private async getEventICalId(booking: Booking, serviceProvider: ServiceProvider) {
		if (booking.serviceProviderId) {
			return await this.calendarsService.createCalendarEvent(booking, serviceProvider.calendar);
		}
		return undefined;
	}

	private async validateTimeSlot(booking: Booking) {
		const timeslotEntry = await this.timeslotsService.getAvailableProvidersForTimeslot(booking.startDateTime, booking.endDateTime, booking.serviceId, booking.serviceProviderId);

		if (timeslotEntry.availabilityCount < 1) {
			const errorMessage = booking.serviceProviderId ? "The service provider is not available for this timeslot"
				: "No available service providers for this timeslot";
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(errorMessage);
		}
	}

	private async validateOutOfSlotBookings(booking: Booking) {
		const { startDateTime, endDateTime, serviceId, serviceProviderId } = booking;

		const searchQuery = new BookingSearchRequest(startDateTime, endDateTime, [BookingStatus.Accepted, BookingStatus.PendingApproval], serviceId, serviceProviderId);

		const pendingAndAcceptedBookings = await this.searchBookings(searchQuery);

		const acceptedBookings = pendingAndAcceptedBookings.filter(acceptedBooking => acceptedBooking.status === BookingStatus.Accepted);

		for (const item of acceptedBookings) {
			const intersects = booking.bookingIntersects({ start: item.startDateTime, end: item.endDateTime });
			if (intersects) {
				throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(`Booking request not valid as it overlaps another accepted booking`);
			}
		}

		if (booking.serviceProviderId && await this.unavailabilitiesService.isUnavailable({
			from: startDateTime,
			to: endDateTime,
			serviceId: booking.serviceId,
			serviceProviderId: booking.serviceProviderId
		})) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(`The service provider is not available in the selected time range.`);
		}
	}
}
