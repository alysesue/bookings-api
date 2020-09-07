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
		const booking = await this.createBooking(bookingRequest, serviceId);

		await this.bookingsValidatorFactory.getValidator(bookingRequest.outOfSlotBooking).validate(booking);

		booking.eventICalId = await this.getEventICalId(booking);

		await this.bookingsRepository.save(booking);
		return this.getBooking(booking.id);
	}

	private static getCitizenUinFin(currentUser: User, bookingRequest: BookingRequest): string {
		if (currentUser && currentUser.isCitizen()) {
			return currentUser.singPassUser.UinFin;
		}
		return bookingRequest.citizenUinFin;
	}

	public async cancelBooking(bookingId: number): Promise<Booking> {
		const booking = await this.getBookingForCancelling(bookingId);
		const eventCalId = booking.eventICalId;
		if (booking.status === BookingStatus.Accepted) {
			const provider = await this.serviceProviderRepo.getServiceProvider({id: booking.serviceProviderId});
			if (!provider) {
				throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(
					`Service provider '${booking.serviceProviderId}' not found`,
				);
			}
			await this.calendarsService.deleteCalendarEvent(provider.calendar, eventCalId);
		}
		booking.status = BookingStatus.Cancelled;
		await this.bookingsRepository.update(booking);

		return booking;
	}

	public async acceptBooking(bookingId: number, acceptRequest: BookingAcceptRequest): Promise<Booking> {
		const booking = await this.getBookingForAccepting(bookingId);

		const provider = await this.serviceProviderRepo.getServiceProvider({id: acceptRequest.serviceProviderId});
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
		booking.acceptedAt = new Date();

		await this.bookingsRepository.update(booking);

		return booking;
	}

	public async searchBookings(searchRequest: BookingSearchRequest): Promise<Booking[]> {
		return await this.bookingsRepository.search(searchRequest, QueryAccessType.Read);
	}

	private async createBooking(bookingRequest: BookingRequest, serviceId: number): Promise<Booking> {
		const currentUser = await this.userContext.getCurrentUser();

		return new BookingBuilder()
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
			.build()
	}

	private async getEventICalId(booking: Booking) {
		if (booking.serviceProviderId) {
			const serviceProvider = await this.serviceProviderRepo.getServiceProvider({id: booking.serviceProviderId});
			return await this.calendarsService.createCalendarEvent(booking, serviceProvider.calendar);
		}
		return null;
	}

	private async getBookingForAccepting(bookingId: number): Promise<Booking> {
		const booking = await this.getBooking(bookingId);
		if (booking.status !== BookingStatus.PendingApproval) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(
				`Booking ${bookingId} is in invalid state for accepting`,
			);
		}
		return booking;
	}

	private async getBookingForCancelling(bookingId: number): Promise<Booking> {
		const booking = await this.getBooking(bookingId);
		if (booking.status === BookingStatus.Cancelled || booking.startDateTime < new Date()) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(
				`Booking ${bookingId} is in invalid state for cancelling`,
			);
		}
		return booking;
	}
}
