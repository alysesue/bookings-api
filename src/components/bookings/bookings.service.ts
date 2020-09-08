import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { Inject, InRequestScope } from 'typescript-ioc';
import { Booking, BookingStatus, User } from '../../models';
import { BookingsRepository } from './bookings.repository';
import { BookingAcceptRequest, BookingRequest, BookingSearchRequest } from './bookings.apicontract';
import { TimeslotsService } from '../timeslots/timeslots.service';
import { CalendarsService } from '../calendars/calendars.service';
import { ServiceProvidersRepository } from '../serviceProviders/serviceProviders.repository';
import { UnavailabilitiesService } from '../unavailabilities/unavailabilities.service';
import { UserContext } from '../../infrastructure/userContext.middleware';
import { QueryAccessType } from '../../core/repository';
import { BookingBuilder } from '../../models/entities/booking';
import { BookingsValidatorFactory } from './validator/bookings.validation';
import { ChangeLogAction } from '../../models/entities/bookingChangeLog';
import { ServicesService } from '../services/services.service';
import { BookingChangeLogsService } from '../bookingChangeLogs/bookingChangeLogs.service';

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
	private userContext: UserContext;
	@Inject
	private bookingsValidatorFactory: BookingsValidatorFactory;
	@Inject
	private servicesService: ServicesService;
	@Inject
	private changeLogsService: BookingChangeLogsService;

	public async getBooking(bookingId: number): Promise<Booking> {
		if (!bookingId) {
			return null;
		}
		const booking = await this.bookingsRepository.getBooking(bookingId);
		if (!booking) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage(`Booking ${bookingId} not found`);
		}
		return booking;
	}

	private static getCitizenUinFin(currentUser: User, bookingRequest: BookingRequest): string {
		if (currentUser && currentUser.isCitizen()) {
			return currentUser.singPassUser.UinFin;
		}
		return bookingRequest.citizenUinFin;
	}

	public async cancelBooking(bookingId: number): Promise<Booking> {
		return await this.changeLogsService.executeAndLogAction(
			bookingId,
			this.getBooking.bind(this),
			this.cancelBookingInternal.bind(this),
		);
	}

	private async cancelBookingInternal(booking: Booking): Promise<[ChangeLogAction, Booking]> {
		if (booking.status === BookingStatus.Cancelled || booking.startDateTime < new Date()) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(
				`Booking ${booking.id} is in invalid state for cancelling`,
			);
		}

		const eventCalId = booking.eventICalId;
		if (booking.status === BookingStatus.Accepted) {
			const provider = await this.serviceProviderRepo.getServiceProvider({ id: booking.serviceProviderId });
			if (!provider) {
				throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(
					`Service provider '${booking.serviceProviderId}' not found`,
				);
			}
			await this.calendarsService.deleteCalendarEvent(provider.calendar, eventCalId);
		}
		booking.status = BookingStatus.Cancelled;
		await this.bookingsRepository.update(booking);
		await this.loadBookingDependencies(booking);

		return [ChangeLogAction.Cancel, booking];
	}

	public async acceptBooking(bookingId: number, acceptRequest: BookingAcceptRequest): Promise<Booking> {
		const acceptAction = (_booking) => this.acceptBookingInternal(_booking, acceptRequest);
		return await this.changeLogsService.executeAndLogAction(bookingId, this.getBooking.bind(this), acceptAction);
	}

	private async acceptBookingInternal(
		booking: Booking,
		acceptRequest: BookingAcceptRequest,
	): Promise<[ChangeLogAction, Booking]> {
		if (booking.status !== BookingStatus.PendingApproval) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(
				`Booking ${booking.id} is in invalid state for accepting`,
			);
		}

		const provider = await this.serviceProviderRepo.getServiceProvider({ id: acceptRequest.serviceProviderId });
		if (!provider) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(
				`Service provider '${acceptRequest.serviceProviderId}' not found`,
			);
		}
		const timeslotEntry = await this.timeslotsService.getAvailableProvidersForTimeslot(
			booking.startDateTime,
			booking.endDateTime,
			booking.serviceId,
		);
		const isProviderAvailable =
			timeslotEntry.availableServiceProviders.filter((e) => e.id === acceptRequest.serviceProviderId).length > 0;
		if (!isProviderAvailable) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(
				`Service provider '${acceptRequest.serviceProviderId}' is not available for this booking.`,
			);
		}

		const eventICalId = await this.calendarsService.createCalendarEvent(booking, provider.calendar);

		booking.status = BookingStatus.Accepted;
		booking.serviceProvider = provider;
		booking.eventICalId = eventICalId;

		await this.bookingsRepository.update(booking);
		await this.loadBookingDependencies(booking);

		return [ChangeLogAction.Accept, booking];
	}

	public async searchBookings(searchRequest: BookingSearchRequest): Promise<Booking[]> {
		return await this.bookingsRepository.search(searchRequest, QueryAccessType.Read);
	}

	private async loadBookingDependencies(booking: Booking): Promise<Booking> {
		if (!booking.service) {
			booking.service = await this.servicesService.getService(booking.serviceId);
		}
		if (booking.serviceProviderId && !booking.serviceProvider) {
			booking.serviceProvider = await this.serviceProviderRepo.getServiceProvider({
				id: booking.serviceProviderId,
			});
		}
		return booking;
	}

	public async save(bookingRequest: BookingRequest, serviceId: number): Promise<Booking> {
		// Potential improvement: each [serviceId, bookingRequest.startDateTime, bookingRequest.endDateTime] save method call should be executed serially.
		// Method calls with different services, or timeslots should still run in parallel.
		const saveAction = (_booking) => this.saveInternal(bookingRequest, serviceId);
		return await this.changeLogsService.executeAndLogAction(null, this.getBooking.bind(this), saveAction);
	}

	private async saveInternal(bookingRequest: BookingRequest, serviceId: number): Promise<[ChangeLogAction, Booking]> {
		const currentUser = await this.userContext.getCurrentUser();

		const booking = new BookingBuilder()
			.withServiceId(serviceId)
			.withStartDateTime(bookingRequest.startDateTime)
			.withEndDateTime(bookingRequest.endDateTime)
			.withServiceProviderId(bookingRequest.serviceProviderId)
			.withRefId(bookingRequest.refId)
			.withLocation(bookingRequest.location)
			.withDescription(bookingRequest.description)
			.withCreator(currentUser)
			.withCitizenUinFin(BookingsService.getCitizenUinFin(currentUser, bookingRequest))
			.withCitizenName(bookingRequest.citizenName)
			.withCitizenPhone(bookingRequest.citizenPhone)
			.withCitizenEmail(bookingRequest.citizenEmail)
			.build();

		await this.bookingsValidatorFactory.getValidator(bookingRequest.outOfSlotBooking).validate(booking);
		booking.eventICalId = await this.getEventICalId(booking);
		await this.bookingsRepository.insert(booking);
		await this.loadBookingDependencies(booking);

		return [ChangeLogAction.Create, booking];
	}

	private async getEventICalId(booking: Booking) {
		if (booking.serviceProviderId) {
			const serviceProvider = await this.serviceProviderRepo.getServiceProvider({
				id: booking.serviceProviderId,
			});
			return await this.calendarsService.createCalendarEvent(booking, serviceProvider.calendar);
		}
		return null;
	}
}
