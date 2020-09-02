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
import { BookingChangeLog, BookingJsonSchemaV1, ChangeLogAction } from "../../models/entities/bookingChangeLog";
import { ServicesService } from "../services/services.service";

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
	private changeLogsRepository: BookingChangeLogsRepository;
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

	private mapBookingState(booking: Booking): BookingJsonSchemaV1 {
		if (!booking)
			return {} as BookingJsonSchemaV1;

		const jsonObj = {
			id: booking.id,
			status: booking.status,
			startDateTime: booking.startDateTime,
			endDateTime: booking.startDateTime,
			serviceId: booking.serviceId,
			serviceName: booking.service.name,
			CitizenUinFin: booking.citizenUinFin,
			// TODO: ADD Citizen data;
			// CitizenName: string,
			// CitizenEmail: string,
			// CitizenPhone: string,
			// Location: string,
			// Description: string,
		} as BookingJsonSchemaV1;

		if (booking.serviceProviderId) {
			const serviceProvider = booking.serviceProvider;
			jsonObj.serviceProviderId = booking.serviceProviderId;
			jsonObj.serviceProviderName = serviceProvider.name;
			jsonObj.serviceProviderEmail = serviceProvider.email;
			// TODO: ADD SP PHONE jsonObj.serviceProviderPhone = serviceProvider.phone;
		}

		return jsonObj;
	}

	private async executeAndLogAction(action: ChangeLogAction, booking: Booking, operation: (booking: Booking) => Promise<Booking>): Promise<Booking> {
		const user = await this.userContext.getCurrentUser();
		const previousState = this.mapBookingState(booking);
		const newBooking = await operation(booking);
		const newState = this.mapBookingState(newBooking);

		const changelog = BookingChangeLog.create({
			action,
			booking: newBooking,
			user,
			previousState,
			newState
		});

		// TODO: save log and booking

		return newBooking;
	}

	public async save(bookingRequest: BookingRequest, serviceId: number): Promise<Booking> {
		// Potential improvement: each [serviceId, bookingRequest.startDateTime, bookingRequest.endDateTime] save method call should be executed serially.
		// Method calls with different services, or timeslots should still run in parallel.
		return await this.executeAndLogAction(ChangeLogAction.Create, null,
			async (_booking) => await this.createBooking(bookingRequest, serviceId));
	}

	public async cancelBooking(bookingId: number): Promise<Booking> {
		const booking = await this.getBookingForCancelling(bookingId);
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

		return booking;
	}

	public async acceptBooking(bookingId: number, acceptRequest: BookingAcceptRequest): Promise<Booking> {
		const booking = await this.getBookingForAccepting(bookingId);

		return await this.executeAndLogAction(ChangeLogAction.Accept, booking,
			async (_booking) => await this.acceptBookingInternal(_booking, acceptRequest));
	}

	private async acceptBookingInternal(booking: Booking, acceptRequest: BookingAcceptRequest): Promise<Booking> {
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
		booking.acceptedAt = new Date();

		return booking;
	}

	public async searchBookings(searchRequest: BookingSearchRequest): Promise<Booking[]> {
		return await this.bookingsRepository.search({ ...searchRequest, accessType: QueryAccessType.Read });
	}

	private async createBooking(bookingRequest: BookingRequest, serviceId: number): Promise<Booking> {
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

		booking.creator = await this.userContext.getCurrentUser();
		if (booking.creator.isCitizen()) {
			booking.citizenUinFin = booking.creator.singPassUser.UinFin;
		}

		booking.eventICalId = await this.getEventICalId(booking, serviceProvider);

		if (!bookingRequest.outOfSlotBooking) {
			await this.validateTimeSlot(booking);
		} else {
			await this.validateOutOfSlotBookings(booking);
		}

		return booking;
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

	private async getBookingForAccepting(bookingId: number): Promise<Booking> {
		const booking = await this.getBooking(bookingId);
		if (booking.status !== BookingStatus.PendingApproval) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(`Booking ${bookingId} is in invalid state for accepting`);
		}
		return booking;
	}

	private async getBookingForCancelling(bookingId: number): Promise<Booking> {
		const booking = await this.getBooking(bookingId);
		if (booking.status === BookingStatus.Cancelled || booking.startDateTime < new Date()) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(`Booking ${bookingId} is in invalid state for cancelling`);

		}
		return booking;
	}
}
