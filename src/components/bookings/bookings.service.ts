import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { Inject, InRequestScope } from 'typescript-ioc';
import { Booking, BookingStatus, ChangeLogAction, Service, ServiceProvider, User, Event } from '../../models';
import { TimeslotsService } from '../timeslots/timeslots.service';
import { ServiceProvidersRepository } from '../serviceProviders/serviceProviders.repository';
import { UnavailabilitiesService } from '../unavailabilities/unavailabilities.service';
import { ServicesService } from '../services/services.service';
import { BookingChangeLogsService } from '../bookingChangeLogs/bookingChangeLogs.service';
import { UserContext } from '../../infrastructure/auth/userContext';
import { ServiceProvidersService } from '../serviceProviders/serviceProviders.service';
import { UsersService } from '../users/users.service';
import { IPagedEntities } from '../../core/pagedEntities';
import { getConfig } from '../../config/app-config';
import { MailObserver } from '../notifications/notification.observer';
import { randomIndex } from '../../tools/arrays';
import { BookingsSubject } from './bookings.subject';
import { BookingsMapper } from './bookings.mapper';
import { BookingActionAuthVisitor } from './bookings.auth';
import { BookingsValidatorFactory } from './validator/bookings.validation';
import {
	BookingAcceptRequestV1,
	BookingChangeUser,
	BookingReject,
	BookingRequestV1,
	BookingSearchRequest,
	EventBookingRequest,
	BookingUpdateRequestV1,
	ValidateOnHoldRequest,
	BookingDetailsRequest,
} from './bookings.apicontract';
import { BookingsRepository } from './bookings.repository';
import { BookingType } from '../../models/bookingType';
import { LifeSGObserver } from '../lifesg/lifesg.observer';
import { ExternalAgencyAppointmentJobAction } from '../lifesg/lifesg.apicontract';
import { SMSObserver } from '../notificationSMS/notificationSMS.observer';
import { EventsService } from '../events/events.service';
import { BookingValidationType, BookingWorkflowType } from '../../models/bookingValidationType';
import { BookingsEventValidatorFactory } from './validator/bookings.event.validation';

@InRequestScope
export class BookingsService {
	@Inject
	private bookingsSubject: BookingsSubject;
	@Inject
	private mailObserver: MailObserver;
	@Inject
	private lifeSGObserver: LifeSGObserver;
	@Inject
	private smsObserver: SMSObserver;
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
	private bookingsEventValidatorFactory: BookingsEventValidatorFactory;
	@Inject
	private servicesService: ServicesService;
	@Inject
	private changeLogsService: BookingChangeLogsService;
	@Inject
	private usersService: UsersService;
	@Inject
	private bookingsMapper: BookingsMapper;
	@Inject
	private eventService: EventsService;

	constructor() {
		this.bookingsSubject.attach(
			getConfig().featureFlag.lifeSGSync
				? [this.mailObserver, this.lifeSGObserver, this.smsObserver]
				: [this.mailObserver, this.smsObserver],
		);
	}

	private static useAdminValidator(user: User, validationType?: BookingValidationType): boolean {
		return user.isAdmin() || (user.isAgency() && validationType === BookingValidationType.Admin);
	}

	public static shouldAutoAccept(
		currentUser: User,
		serviceProvider?: ServiceProvider,
		validationType?: BookingValidationType,
	): boolean {
		if (!serviceProvider) {
			return false;
		}

		return currentUser.isAdmin() || (currentUser.isAgency() && validationType === BookingValidationType.Admin)
			? true
			: serviceProvider.autoAcceptBookings;
	}

	public async cancelBooking(bookingId: number): Promise<Booking> {
		const booking = await this.changeLogsService.executeAndLogAction(
			bookingId,
			this.getBookingInternal.bind(this),
			this.cancelBookingInternal.bind(this),
		);
		this.bookingsSubject.notify({
			booking,
			bookingType: BookingType.CancelledOrRejected,
			action: ExternalAgencyAppointmentJobAction.CANCEL,
		});
		return booking;
	}

	public async getBooking(bookingId: number): Promise<Booking> {
		return this.getBookingInternal(bookingId, {});
	}

	public async getBookingByUUID(bookingUUID: string): Promise<Booking> {
		return this.getBookingInternalByUUID(bookingUUID);
	}

	private async getBookingInternalByUUID(
		bookingUUID: string,
		options: { byPassAuth?: boolean } = {},
	): Promise<Booking> {
		if (!bookingUUID) {
			return null;
		}
		const booking = await this.bookingsRepository.getBookingByUUID(bookingUUID, options);
		if (!booking) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage(`Booking ${bookingUUID} not found`);
		}
		return booking;
	}

	private async getBookingInternal(bookingId: number, options: { byPassAuth?: boolean }): Promise<Booking> {
		if (!bookingId) {
			return null;
		}
		const booking = await this.bookingsRepository.getBooking(bookingId, options);
		if (!booking) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage(`Booking ${bookingId} not found`);
		}
		return booking;
	}

	public async acceptBooking(bookingId: number, acceptRequest: BookingAcceptRequestV1): Promise<Booking> {
		const acceptAction = (_booking) => this.acceptBookingInternal(_booking, acceptRequest);
		const booking = await this.changeLogsService.executeAndLogAction(
			bookingId,
			this.getBookingInternal.bind(this),
			acceptAction,
		);
		this.bookingsSubject.notify({
			booking,
			bookingType: BookingType.Updated,
			action: ExternalAgencyAppointmentJobAction.UPDATE,
		});
		return booking;
	}

	public async update(bookingId: number, bookingRequest: BookingUpdateRequestV1): Promise<Booking> {
		const updateAction = (_booking) => {
			return this.updateInternal(_booking, bookingRequest, () => {});
		};
		const booking = await this.changeLogsService.executeAndLogAction(
			bookingId,
			this.getBookingInternal.bind(this),
			updateAction,
		);
		this.bookingsSubject.notify({
			booking,
			bookingType: BookingType.Updated,
			action: ExternalAgencyAppointmentJobAction.UPDATE,
		});
		return booking;
	}

	public async rejectBooking(bookingId: number, bookingReject: BookingReject): Promise<Booking> {
		const rejectAction = (_booking) => this.rejectBookingInternal(_booking, bookingReject);
		const booking = await this.changeLogsService.executeAndLogAction(
			bookingId,
			this.getBookingInternal.bind(this),
			rejectAction,
		);
		this.bookingsSubject.notify({
			booking,
			bookingType: BookingType.CancelledOrRejected,
			action: ExternalAgencyAppointmentJobAction.UPDATE,
		});
		return booking;
	}

	public async reschedule(bookingId: number, rescheduleRequest: BookingUpdateRequestV1): Promise<Booking> {
		const rescheduleAction = (_booking) => this.rescheduleInternal(_booking, rescheduleRequest);
		const booking = await this.changeLogsService.executeAndLogAction(
			bookingId,
			this.getBookingInternal.bind(this),
			rescheduleAction,
		);
		this.bookingsSubject.notify({
			booking,
			bookingType: BookingType.Updated,
			action: ExternalAgencyAppointmentJobAction.UPDATE,
		});
		return booking;
	}

	public async searchBookings(searchRequest: BookingSearchRequest): Promise<IPagedEntities<Booking>> {
		return await this.bookingsRepository.search(searchRequest);
	}

	public async searchBookingsReturnAll(searchRequest: BookingSearchRequest): Promise<Booking[]> {
		return await this.bookingsRepository.searchReturnAll(searchRequest);
	}

	public async bookAnEvent(
		eventBookingRequest: EventBookingRequest,
		eventId: number,
		bypassCaptchaAndAutoAccept = false,
	): Promise<Booking> {
		const eventDetails = await this.eventService.getById(eventId);
		const saveAction = () =>
			this.bookEventInternal(
				eventBookingRequest,
				eventDetails,
				eventDetails.serviceId,
				bypassCaptchaAndAutoAccept,
			);
		const booking = await this.changeLogsService.executeAndLogAction(
			null,
			this.getBookingInternal.bind(this),
			saveAction,
		);
		// this.bookingsSubject.notify({
		// 	booking,
		// 	bookingType: BookingType.Created,
		// 	action: ExternalAgencyAppointmentJobAction.CREATE,
		// });
		return booking;
	}

	public async save(
		bookingRequest: BookingRequestV1,
		serviceId: number,
		bypassCaptchaAndAutoAccept = false,
	): Promise<Booking> {
		const saveAction = () => this.saveInternal(bookingRequest, serviceId, bypassCaptchaAndAutoAccept);
		const booking = await this.changeLogsService.executeAndLogAction(
			null,
			this.getBookingInternal.bind(this),
			saveAction,
		);
		this.bookingsSubject.notify({
			booking,
			bookingType: BookingType.Created,
			action: ExternalAgencyAppointmentJobAction.CREATE,
		});
		return booking;
	}

	public async checkLimit(limit: number, exportLmit: number): Promise<void> {
		if (limit > exportLmit) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(`Maximum rows for export: ${exportLmit}`);
		}
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
		booking.creator = await this.usersService.persistUserIfRequired(await this.userContext.getCurrentUser());

		return [ChangeLogAction.Cancel, booking];
	}

	private async rejectBookingInternal(
		booking: Booking,
		bookingReject: BookingReject,
	): Promise<[ChangeLogAction, Booking]> {
		if (booking.status !== BookingStatus.PendingApproval) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(
				`Booking ${booking.id} is in invalid state for rejection`,
			);
		}

		booking.status = BookingStatus.Rejected;
		booking.reasonToReject = bookingReject?.reasonToReject;

		await this.loadBookingDependencies(booking);
		await this.verifyActionPermission(booking, ChangeLogAction.Reject);
		await this.bookingsRepository.update(booking);

		return [ChangeLogAction.Reject, booking];
	}

	private static shouldMarkOnHold(request: BookingDetailsRequest, service: Service, user: User): boolean {
		if (request.workflowType === BookingWorkflowType.OnHold) return true;
		if (user.isAdmin() || user.isAgency()) return false;
		return service.isOnHold || service.isStandAlone;
	}

	private async updateBookingStatus({
		request,
		booking,
		service,
		serviceProvider = null,
	}: {
		request: BookingRequestV1;
		booking: Booking;
		service: Service;
		serviceProvider: ServiceProvider;
	}): Promise<void> {
		const currentUser = await this.userContext.getCurrentUser();
		const shouldMarkOnHold = BookingsService.shouldMarkOnHold(request, service, currentUser);

		if (booking.serviceProviderId && !serviceProvider) {
			throw new Error('Service provided not loaded');
		}

		if (shouldMarkOnHold) {
			booking.markOnHold();
		} else {
			const autoAccept = BookingsService.shouldAutoAccept(currentUser, serviceProvider, request.validationType);
			booking.setAutoAccept({ autoAccept });
		}
	}

	private async rescheduleInternal(
		previousBooking: Booking,
		rescheduleRequest: BookingUpdateRequestV1,
	): Promise<[ChangeLogAction, Booking]> {
		if (!previousBooking.isValidForRescheduling()) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('Booking in invalid state for rescheduling');
		}

		const afterMap = async (updatedBooking: Booking): Promise<void> => {
			await this.updateBookingStatus({
				booking: updatedBooking,
				service: updatedBooking.service,
				serviceProvider: updatedBooking.serviceProvider,
				request: rescheduleRequest,
			});
		};

		return this.updateInternal(previousBooking, rescheduleRequest, afterMap);
	}

	private async acceptBookingInternal(
		booking: Booking,
		acceptRequest: BookingAcceptRequestV1,
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
			const isProviderAvailable = await this.timeslotsService.isProviderAvailableForTimeslot({
				startDateTime: booking.startDateTime,
				endDateTime: booking.endDateTime,
				serviceId: booking.serviceId,
				serviceProviderId: acceptRequest.serviceProviderId,
				skipUnassigned: true,
				filterDaysInAdvance: false,
			});

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

	private async updateInternal(
		previousBooking: Booking,
		bookingRequest: BookingUpdateRequestV1,
		afterMap: (updatedBooking: Booking) => void | Promise<void>,
	): Promise<[ChangeLogAction, Booking]> {
		const { service, isAgencyUser } = await this.bookingRequestExtraction(previousBooking.serviceId);

		const updatedBooking = previousBooking.clone();
		const currentUser = await this.userContext.getCurrentUser();
		const validator = this.bookingsValidatorFactory.getValidator(
			BookingsService.useAdminValidator(currentUser, bookingRequest.validationType),
		);
		validator.bypassCaptcha(isAgencyUser);

		await this.bookingsMapper.mapRequest({
			request: { ...bookingRequest, citizenUinFinUpdated: bookingRequest.citizenUinFinUpdated || false },
			booking: updatedBooking,
			service,
		});
		await this.bookingsMapper.mapDynamicValuesRequest(bookingRequest, updatedBooking, validator);

		updatedBooking.serviceProvider = await this.serviceProviderRepo.getServiceProvider({
			id: updatedBooking.serviceProviderId,
		});
		await afterMap(updatedBooking);
		await validator.validate(updatedBooking);
		const changeLogAction = updatedBooking.getUpdateChangeType(previousBooking);
		await this.loadBookingDependencies(updatedBooking);
		await this.verifyActionPermission(updatedBooking, changeLogAction);
		await this.bookingsRepository.update(updatedBooking);
		updatedBooking.creator = await this.usersService.persistUserIfRequired(currentUser);

		return [changeLogAction, updatedBooking];
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

	private async bookingRequestExtraction(serviceId: number): Promise<BookingRequestExtraction> {
		const currentUser = await this.userContext.getCurrentUser();
		const isAdminUser = currentUser.isAdmin();
		const isAgencyUser = currentUser.isAgency();
		const service: Service = await this.servicesService.getService(serviceId);
		const isOnHold = service.isOnHold;
		const isStandAlone = service.isStandAlone;

		return {
			currentUser,
			isAdminUser,
			isAgencyUser,
			service,
			isOnHold,
			isStandAlone,
		} as BookingRequestExtraction;
	}

	private async bookEventInternal(
		eventBookingRequest: EventBookingRequest,
		event: Event,
		serviceId: number,
		shouldBypassCaptchaAndAutoAccept = false,
	): Promise<[ChangeLogAction, Booking]> {
		const { currentUser, isAgencyUser, service } = await this.bookingRequestExtraction(serviceId);
		const useAdminValidator = BookingsService.useAdminValidator(currentUser, eventBookingRequest.validationType);
		const booking = Booking.createNew({ creator: currentUser });
		await this.bookingsMapper.mapEventBookingRequests({
			request: { ...eventBookingRequest, citizenUinFinUpdated: true },
			booking,
			service,
			event,
		});

		const shouldMarkOnHold = BookingsService.shouldMarkOnHold(eventBookingRequest, service, currentUser);
		if (shouldMarkOnHold) {
			booking.markOnHold();
		} else {
			booking.setAutoAccept({
				autoAccept: true,
			});
		}

		const validator = this.bookingsEventValidatorFactory.getValidator(useAdminValidator);
		validator.bypassCaptcha(shouldBypassCaptchaAndAutoAccept || isAgencyUser);
		await this.bookingsMapper.mapDynamicValuesRequest(eventBookingRequest, booking, validator);

		await this.loadBookingDependencies(booking);
		await validator.validate(booking);
		await this.verifyActionPermission(booking, ChangeLogAction.Create);

		// Persists in memory user only after validating booking.
		booking.creator = await this.usersService.persistUserIfRequired(currentUser);
		await this.bookingsRepository.insert(booking);
		return [ChangeLogAction.Create, booking];
	}

	private async saveInternal(
		bookingRequest: BookingRequestV1,
		serviceId: number,
		shouldBypassCaptchaAndAutoAccept = false,
	): Promise<[ChangeLogAction, Booking]> {
		const { currentUser, isAgencyUser, service } = await this.bookingRequestExtraction(serviceId);
		const useAdminValidator = BookingsService.useAdminValidator(currentUser, bookingRequest.validationType);

		let serviceProvider: ServiceProvider | undefined;
		if (bookingRequest.serviceProviderId) {
			serviceProvider = await this.serviceProvidersService.getServiceProvider(bookingRequest.serviceProviderId);
		} else if (service.isSpAutoAssigned) {
			const serviceProviders = await this.serviceProvidersService.getAvailableServiceProviders(
				bookingRequest.startDateTime,
				bookingRequest.endDateTime,
				!useAdminValidator,
				serviceId,
			);
			const random = randomIndex(serviceProviders);
			serviceProvider = serviceProviders.length ? serviceProviders[random] : undefined;
		}

		const booking = Booking.createNew({ creator: currentUser });
		await this.bookingsMapper.mapRequest({
			request: { ...bookingRequest, citizenUinFinUpdated: true },
			booking,
			service,
		});
		booking.serviceProviderId = serviceProvider?.id;
		booking.serviceProvider = serviceProvider;

		if (shouldBypassCaptchaAndAutoAccept) {
			booking.setAutoAccept({ autoAccept: true });
		} else {
			await this.updateBookingStatus({
				request: bookingRequest,
				booking,
				service,
				serviceProvider,
			});
		}

		const validator = this.bookingsValidatorFactory.getValidator(useAdminValidator);
		validator.bypassCaptcha(shouldBypassCaptchaAndAutoAccept || isAgencyUser);
		await this.bookingsMapper.mapDynamicValuesRequest(bookingRequest, booking, validator);

		await this.loadBookingDependencies(booking);
		await validator.validate(booking);
		await this.verifyActionPermission(booking, ChangeLogAction.Create);

		// Persists in memory user only after validating booking.
		booking.creator = await this.usersService.persistUserIfRequired(currentUser);
		await this.bookingsRepository.insert(booking);
		booking.bookedSlots = [];
		return [ChangeLogAction.Create, booking];
	}

	private async validateOnHoldBookingInternal(
		previousBooking: Booking,
		bookingRequest: ValidateOnHoldRequest,
	): Promise<[ChangeLogAction, Booking]> {
		const serviceProvider = await this.serviceProviderRepo.getServiceProvider({
			id: previousBooking.serviceProviderId,
		});

		if (previousBooking.isValidOnHoldBooking()) {
			const updatedBooking = previousBooking.clone();
			const { service } = await this.bookingRequestExtraction(previousBooking.serviceId);
			await this.bookingsMapper.mapBookingDetails({
				request: { ...bookingRequest, citizenUinFinUpdated: bookingRequest.citizenUinFinUpdated || false },
				booking: updatedBooking,
				service,
			});

			const validator = this.bookingsValidatorFactory.getOnHoldValidator();
			await this.bookingsMapper.mapDynamicValuesRequest(bookingRequest, updatedBooking, validator);

			if ((serviceProvider && serviceProvider.autoAcceptBookings) || previousBooking.eventId) {
				updatedBooking.status = BookingStatus.Accepted;
			} else {
				updatedBooking.status = BookingStatus.PendingApproval;
			}

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

	private async validateOnHoldEventBookingInternal(
		previousBooking: Booking,
		bookingRequest: ValidateOnHoldRequest,
	): Promise<[ChangeLogAction, Booking]> {
		if (previousBooking.isValidOnHoldBooking()) {
			const updatedBooking = previousBooking.clone();
			const { service } = await this.bookingRequestExtraction(previousBooking.serviceId);
			await this.bookingsMapper.mapBookingDetails({
				request: { ...bookingRequest, citizenUinFinUpdated: bookingRequest.citizenUinFinUpdated || false },
				booking: updatedBooking,
				service,
			});

			const validator = this.bookingsEventValidatorFactory.getOnHoldValidator();
			await this.bookingsMapper.mapDynamicValuesRequest(bookingRequest, updatedBooking, validator);

			if (previousBooking.eventId) {
				updatedBooking.status = BookingStatus.Accepted;
			}

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

	public async validateOnHoldBooking(
		bookingId: number,
		bookingRequest: ValidateOnHoldRequest,
		forEventBooking = false,
	): Promise<Booking> {
		const validateAction = forEventBooking
			? (_booking) => this.validateOnHoldEventBookingInternal(_booking, bookingRequest)
			: (_booking) => this.validateOnHoldBookingInternal(_booking, bookingRequest);
		const booking = await this.changeLogsService.executeAndLogAction(
			bookingId,
			this.getBookingInternal.bind(this),
			validateAction,
		);
		this.bookingsSubject.notify({
			booking,
			bookingType: BookingType.Created,
			action: ExternalAgencyAppointmentJobAction.UPDATE,
		});
		return booking;
	}

	public async changeUser(request: BookingChangeUser): Promise<Booking> {
		const getBooking = async (): Promise<Booking> => {
			const booking = await this.bookingsRepository.getBookingByUUID(request.bookingUUID, { byPassAuth: true });

			if (!booking || booking.id !== request.bookingId) {
				throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage(`Booking ${request.bookingId} not found`);
			}

			return booking;
		};

		return await this.changeLogsService.executeAndLogAction(
			request.bookingId,
			getBooking,
			this.changeUserInternal.bind(this),
		);
	}

	private async changeUserInternal(_booking: Booking): Promise<[ChangeLogAction, Booking]> {
		const currentUser = await this.userContext.getCurrentUser();
		await this.loadBookingDependencies(_booking);

		const newBooking = _booking.clone();
		if (newBooking.creatorId !== currentUser.id) {
			if (!newBooking.isValidOnHoldBooking()) {
				throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(
					`Booking ${newBooking.id} is in invalid state for user change.`,
				);
			}

			await this.bookingsMapper.updateDetailsFromUser({
				booking: newBooking,
				service: newBooking.service,
			});

			const user = await this.usersService.persistUserIfRequired(currentUser);
			newBooking.creator = user;
			newBooking.creatorId = user.id;
		}

		await this.bookingsRepository.update(newBooking);
		return [ChangeLogAction.UpdateUser, newBooking];
	}
}

export type BookingRequestExtraction = {
	currentUser: User;
	isAdminUser: boolean;
	isAgencyUser: boolean;
	service: Service;
	isOnHold: boolean;
	isStandAlone: boolean;
};
