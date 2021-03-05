import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { Inject, InRequestScope } from 'typescript-ioc';
import { Booking, BookingStatus, ChangeLogAction, Service, ServiceProvider, User } from '../../models';
import { BookingsRepository } from './bookings.repository';
import {
	BookingAcceptRequest,
	BookingDetailsRequest,
	BookingRequest,
	BookingSearchRequest,
	BookingUpdateRequest,
} from './bookings.apicontract';
import { TimeslotsService } from '../timeslots/timeslots.service';
import { ServiceProvidersRepository } from '../serviceProviders/serviceProviders.repository';
import { UnavailabilitiesService } from '../unavailabilities/unavailabilities.service';
import { BookingBuilder } from '../../models/entities/booking';
import { BookingsValidatorFactory } from './validator/bookings.validation';
import { ServicesService } from '../services/services.service';
import { BookingChangeLogsService } from '../bookingChangeLogs/bookingChangeLogs.service';
import { UserContext } from '../../infrastructure/auth/userContext';
import { BookingActionAuthVisitor } from './bookings.auth';
import { ServiceProvidersService } from '../serviceProviders/serviceProviders.service';
import { UsersService } from '../users/users.service';
import { BookingsMapper } from './bookings.mapper';
import { IPagedEntities } from '../../core/pagedEntities';
import { getConfig } from '../../config/app-config';

@InRequestScope
export class BookingsService {
	@Inject
	public unavailabilitiesService: UnavailabilitiesService;
	@Inject
	private bookingsRepository: BookingsRepository;
	@Inject
	private timeslotsService: TimeslotsService;
	@Inject
	private serviceProviderRepo: ServiceProvidersRepository;
	@Inject
	private serviceProvidersService: ServiceProvidersService;
	@Inject
	private userContext: UserContext;
	@Inject
	private bookingsValidatorFactory: BookingsValidatorFactory;
	@Inject
	private servicesService: ServicesService;
	@Inject
	private changeLogsService: BookingChangeLogsService;
	@Inject
	private usersService: UsersService;

	private static canCreateOutOfSlot(user: User): boolean {
		return user.isAdmin() || user.isAgency();
	}

	public static shouldAutoAccept(currentUser: User, serviceProvider?: ServiceProvider): boolean {
		if (!serviceProvider) {
			return false;
		}

		if (currentUser.isAdmin() || currentUser.isAgency()) {
			return true;
		}

		return serviceProvider.autoAcceptBookings;
	}

	public async cancelBooking(bookingId: number): Promise<Booking> {
		return await this.changeLogsService.executeAndLogAction(
			bookingId,
			this.getBooking.bind(this),
			this.cancelBookingInternal.bind(this),
		);
	}

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

	public async acceptBooking(bookingId: number, acceptRequest: BookingAcceptRequest): Promise<Booking> {
		const acceptAction = (_booking) => this.acceptBookingInternal(_booking, acceptRequest);
		return await this.changeLogsService.executeAndLogAction(bookingId, this.getBooking.bind(this), acceptAction);
	}

	public async update(bookingId: number, bookingRequest: BookingUpdateRequest): Promise<Booking> {
		const updateAction = (_booking) => {
			if (!bookingRequest.citizenUinFinUpdated) {
				bookingRequest.citizenUinFin = _booking.citizenUinFin;
			}
			return this.updateInternal(_booking, bookingRequest, () => {});
		};
		return await this.changeLogsService.executeAndLogAction(bookingId, this.getBooking.bind(this), updateAction);
	}

	public async rejectBooking(bookingId: number): Promise<Booking> {
		return await this.changeLogsService.executeAndLogAction(
			bookingId,
			this.getBooking.bind(this),
			this.rejectBookingInternal.bind(this),
		);
	}

	public async reschedule(bookingId: number, rescheduleRequest: BookingRequest): Promise<Booking> {
		const rescheduleAction = (_booking) => this.rescheduleInternal(_booking, rescheduleRequest);
		return await this.changeLogsService.executeAndLogAction(
			bookingId,
			this.getBooking.bind(this),
			rescheduleAction,
		);
	}

	public async searchBookings(searchRequest: BookingSearchRequest): Promise<IPagedEntities<Booking>> {
		return await this.bookingsRepository.search(searchRequest);
	}

	public async save(
		bookingRequest: BookingRequest,
		serviceId: number,
		bypassCaptcha: boolean = false,
	): Promise<Booking> {
		// Potential improvement: each [serviceId, bookingRequest.startDateTime, bookingRequest.endDateTime] save method call should be executed serially.
		// Method calls with different services, or timeslots should still run in parallel.
		const saveAction = () => this.saveInternal(bookingRequest, serviceId, bypassCaptcha);
		return await this.changeLogsService.executeAndLogAction(null, this.getBooking.bind(this), saveAction);
	}

	private async verifyActionPermission(booking: Booking, action: ChangeLogAction): Promise<void> {
		const authGroups = await this.userContext.getAuthGroups();
		if (!new BookingActionAuthVisitor(booking, action).hasPermission(authGroups)) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_AUTHORIZATION).setMessage(
				`User cannot perform this booking action (${action}) for this service.`,
			);
		}
	}

	private async cancelBookingInternal(booking: Booking): Promise<[ChangeLogAction, Booking]> {
		if (booking.status === BookingStatus.Cancelled || booking.startDateTime < new Date()) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(
				`Booking ${booking.id} is in invalid state for cancelling`,
			);
		}

		if (booking.status === BookingStatus.Accepted) {
			const provider = await this.serviceProviderRepo.getServiceProvider({ id: booking.serviceProviderId });
			if (!provider) {
				throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(
					`Service provider '${booking.serviceProviderId}' not found`,
				);
			}
		}
		booking.status = BookingStatus.Cancelled;

		await this.loadBookingDependencies(booking);
		await this.verifyActionPermission(booking, ChangeLogAction.Cancel);
		await this.bookingsRepository.update(booking);

		return [ChangeLogAction.Cancel, booking];
	}

	private async rejectBookingInternal(booking: Booking): Promise<[ChangeLogAction, Booking]> {
		if (booking.status !== BookingStatus.PendingApproval) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(
				`Booking ${booking.id} is in invalid state for rejection`,
			);
		}

		booking.status = BookingStatus.Rejected;

		await this.loadBookingDependencies(booking);
		await this.verifyActionPermission(booking, ChangeLogAction.Reject);
		await this.bookingsRepository.update(booking);

		return [ChangeLogAction.Reject, booking];
	}

	private async rescheduleInternal(
		previousBooking: Booking,
		rescheduleRequest: BookingRequest,
	): Promise<[ChangeLogAction, Booking]> {
		if (!previousBooking.isValidForRescheduling()) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('Booking in invalid state for rescheduling');
		}
		const currentUser = await this.userContext.getCurrentUser();

		const afterMap = (updatedBooking: Booking, serviceProvider: ServiceProvider) => {
			if (serviceProvider) {
				updatedBooking.status = BookingsService.getBookingCreationStatus(currentUser, serviceProvider);
			}
		};

		return this.updateInternal(previousBooking, rescheduleRequest, afterMap);
	}

	private async acceptBookingInternal(
		booking: Booking,
		acceptRequest: BookingAcceptRequest,
	): Promise<[ChangeLogAction, Booking]> {
		if (booking.status !== BookingStatus.PendingApproval && booking.status !== BookingStatus.OnHold) {
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

		if (booking.serviceProviderId !== acceptRequest.serviceProviderId) {
			const isProviderAvailable = await this.timeslotsService.isProviderAvailableForTimeslot(
				booking.startDateTime,
				booking.endDateTime,
				booking.serviceId,
				acceptRequest.serviceProviderId,
				true,
			);

			if (!isProviderAvailable) {
				throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(
					`Service provider '${acceptRequest.serviceProviderId}' is not available for this booking.`,
				);
			}
		}

		booking.status = BookingStatus.Accepted;
		booking.serviceProvider = provider;

		await this.loadBookingDependencies(booking);
		await this.verifyActionPermission(booking, ChangeLogAction.Accept);
		await this.bookingsRepository.update(booking);

		return [ChangeLogAction.Accept, booking];
	}

	public async updateInternal(
		previousBooking: Booking,
		bookingRequest: BookingRequest,
		afterMap: (updatedBooking: Booking, serviceProvider: ServiceProvider) => void | Promise<void>,
	): Promise<[ChangeLogAction, Booking]> {
		const updatedBooking = previousBooking.clone();
		const currentUser = await this.userContext.getCurrentUser();
		BookingsMapper.mapRequest(bookingRequest, updatedBooking, currentUser);

		updatedBooking.serviceProvider = await this.serviceProviderRepo.getServiceProvider({
			id: updatedBooking.serviceProviderId,
		});
		await afterMap(updatedBooking, updatedBooking.serviceProvider);
		const validator = this.bookingsValidatorFactory.getValidator(BookingsService.canCreateOutOfSlot(currentUser));
		validator.bypassCaptcha(getConfig().isAutomatedTest);
		await validator.validate(updatedBooking);

		const changeLogAction = updatedBooking.getUpdateChangeType(previousBooking);
		await this.loadBookingDependencies(updatedBooking);
		await this.verifyActionPermission(updatedBooking, changeLogAction);
		await this.bookingsRepository.update(updatedBooking);

		return [changeLogAction, updatedBooking];
	}

	private static getBookingCreationStatus(currentUser: User, serviceProvider?: ServiceProvider): BookingStatus {
		return this.shouldAutoAccept(currentUser, serviceProvider)
			? BookingStatus.Accepted
			: BookingStatus.PendingApproval;
	}

	private async loadBookingDependencies(booking: Booking): Promise<Booking> {
		if (!booking.service) {
			booking.service = await this.servicesService.getService(booking.serviceId);
		}
		if (booking.serviceProviderId && !booking.serviceProvider) {
			booking.serviceProvider = await this.serviceProvidersService.getServiceProvider(booking.serviceProviderId);
		}
		return booking;
	}

	private async saveInternal(
		bookingRequest: BookingRequest,
		serviceId: number,
		shouldBypassCaptcha: boolean = false,
	): Promise<[ChangeLogAction, Booking]> {
		const currentUser = await this.userContext.getCurrentUser();
		const service: Service = await this.servicesService.getService(serviceId);
		const isStandAlone = service.isStandAlone;
		let serviceProvider: ServiceProvider | undefined;
		if (bookingRequest.serviceProviderId) {
			serviceProvider = await this.serviceProvidersService.getServiceProvider(bookingRequest.serviceProviderId);
		}

		const booking = new BookingBuilder()
			.withServiceId(serviceId)
			.withStartDateTime(bookingRequest.startDateTime)
			.withEndDateTime(bookingRequest.endDateTime)
			.withServiceProviderId(bookingRequest.serviceProviderId)
			.withRefId(bookingRequest.refId)
			.withLocation(bookingRequest.location)
			.withDescription(bookingRequest.description)
			.withCreator(currentUser)
			.withCitizenUinFin(BookingsMapper.getCitizenUinFin(currentUser, bookingRequest))
			.withCitizenName(bookingRequest.citizenName)
			.withCitizenPhone(bookingRequest.citizenPhone)
			.withCitizenEmail(bookingRequest.citizenEmail)
			.withAutoAccept(BookingsService.shouldAutoAccept(currentUser, serviceProvider))
			.withMarkOnHold(isStandAlone ? true : service.isOnHold)
			.withCaptchaToken(bookingRequest.captchaToken)
			.withCaptchaOrigin(bookingRequest.captchaOrigin)
			.build();

		booking.serviceProvider = serviceProvider;
		await this.loadBookingDependencies(booking);
		const validator = this.bookingsValidatorFactory.getValidator(BookingsService.canCreateOutOfSlot(currentUser));
		validator.bypassCaptcha(shouldBypassCaptcha || getConfig().isAutomatedTest);
		await validator.validate(booking);

		await this.verifyActionPermission(booking, ChangeLogAction.Create);

		// Persists in memory user only after validating booking.
		booking.creator = await this.usersService.persistUserIfRequired(currentUser);
		await this.bookingsRepository.insert(booking);

		return [ChangeLogAction.Create, booking];
	}

	private async validateOnHoldBookingInternal(
		previousBooking: Booking,
		bookingRequest: BookingDetailsRequest,
	): Promise<[ChangeLogAction, Booking]> {
		const serviceProvider = await this.serviceProviderRepo.getServiceProvider({
			id: previousBooking.serviceProviderId,
		});

		if (previousBooking.isValidOnHoldBooking()) {
			const currentUser = await this.userContext.getCurrentUser();
			const updatedBooking = previousBooking.clone();
			BookingsMapper.mapBookingDetails(bookingRequest, updatedBooking, currentUser);

			if (serviceProvider.autoAcceptBookings) {
				updatedBooking.status = BookingStatus.Accepted;
			} else {
				updatedBooking.status = BookingStatus.PendingApproval;
			}

			const validator = this.bookingsValidatorFactory.getValidator(true);
			validator.bypassCaptcha(getConfig().isAutomatedTest);
			await validator.validate(updatedBooking);

			const changeLogAction = updatedBooking.getUpdateChangeType(previousBooking);
			await this.loadBookingDependencies(updatedBooking);
			await this.verifyActionPermission(updatedBooking, changeLogAction);
			await this.bookingsRepository.update(updatedBooking);

			return [changeLogAction, updatedBooking];
		} else {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(
				`Booking ${previousBooking.id} is not on hold or has expired`,
			);
		}
	}

	public async validateOnHoldBooking(bookingId: number, bookingRequest: BookingDetailsRequest): Promise<Booking> {
		const validateAction = (_booking) => this.validateOnHoldBookingInternal(_booking, bookingRequest);
		return await this.changeLogsService.executeAndLogAction(bookingId, this.getBooking.bind(this), validateAction);
	}
}
