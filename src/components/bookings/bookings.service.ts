import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { Inject, InRequestScope } from 'typescript-ioc';
import { Booking, BookingStatus, ChangeLogAction, Service, ServiceProvider, User } from '../../models';
import { TimeslotsService } from '../timeslots/timeslots.service';
import { ServiceProvidersRepository } from '../serviceProviders/serviceProviders.repository';
import { UnavailabilitiesService } from '../unavailabilities/unavailabilities.service';
import { BookingBuilder } from '../../models/entities/booking';
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
	BookingAcceptRequest,
	BookingDetailsRequest,
	BookingReject,
	BookingRequest,
	BookingSearchRequest,
	BookingUpdateRequest,
} from './bookings.apicontract';
import { BookingsRepository } from './bookings.repository';
import { BookingType } from '../../../src/models/bookingType';
import { LifeSGObserver } from '../lifesg/lifesg.observer';
import { ExternalAgencyAppointmentJobAction } from '../lifesg/lifesg.apicontract';
import { SMSObserver } from '../notificationSMS/notificationSMS.observer';
import { MyInfoService } from '../myInfo/myInfo.service';
import { BookingValidationType } from '../../models/bookingValidationType';

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
	private servicesService: ServicesService;
	@Inject
	private changeLogsService: BookingChangeLogsService;
	@Inject
	private usersService: UsersService;
	@Inject
	private bookingsMapper: BookingsMapper;
	@Inject
	private myInfoService: MyInfoService;

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
		shouldAutoAccept = false,
		validationType?: BookingValidationType,
	): boolean {
		if (!serviceProvider) {
			return false;
		}

		return shouldAutoAccept ||
			currentUser.isAdmin() ||
			(currentUser.isAgency() && validationType === BookingValidationType.Admin)
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
		return this.getBookingInternal(bookingId);
	}

	public async getBookingByUUID(bookingUUID: string): Promise<Booking> {
		return this.getBookingInternalByUUID(bookingUUID);
	}

	private async getBookingInternalByUUID(bookingUUID: string): Promise<Booking> {
		if (!bookingUUID) {
			return null;
		}
		const booking = await this.bookingsRepository.getBookingByUUID(bookingUUID);
		if (!booking) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage(`Booking ${bookingUUID} not found`);
		}
		return booking;
	}

	private async getBookingInternal(bookingId: number): Promise<Booking> {
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

	public async update(bookingId: number, bookingRequest: BookingUpdateRequest): Promise<Booking> {
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

	public async reschedule(bookingId: number, rescheduleRequest: BookingRequest): Promise<Booking> {
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

	public async save(
		bookingRequest: BookingRequest,
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

	private async rescheduleInternal(
		previousBooking: Booking,
		rescheduleRequest: BookingUpdateRequest,
	): Promise<[ChangeLogAction, Booking]> {
		if (!previousBooking.isValidForRescheduling()) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('Booking in invalid state for rescheduling');
		}
		const currentUser = await this.userContext.getCurrentUser();

		const afterMap = (updatedBooking: Booking, serviceProvider: ServiceProvider) => {
			const isServiceOnHold = () => {
				if (currentUser.isAdmin() || currentUser.isAgency()) return false;
				return updatedBooking.service.isOnHold || updatedBooking.service.isStandAlone;
			};

			if (isServiceOnHold()) {
				const HOLD_DURATION_IN_MINS = 10;
				updatedBooking.status = BookingStatus.OnHold;
				updatedBooking.onHoldUntil = new Date();
				updatedBooking.onHoldUntil.setMinutes(updatedBooking.onHoldUntil.getMinutes() + HOLD_DURATION_IN_MINS);
			} else if (serviceProvider) {
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
		bookingRequest: BookingUpdateRequest,
		afterMap: (updatedBooking: Booking, serviceProvider: ServiceProvider) => void | Promise<void>,
	): Promise<[ChangeLogAction, Booking]> {
		if (!bookingRequest.citizenUinFinUpdated) {
			bookingRequest.citizenUinFin = previousBooking.citizenUinFin;
		}

		const updatedBooking = previousBooking.clone();
		const currentUser = await this.userContext.getCurrentUser();
		const validator = this.bookingsValidatorFactory.getValidator(
			BookingsService.useAdminValidator(currentUser, bookingRequest.validationType),
		);

		BookingsMapper.mapRequest(bookingRequest, updatedBooking, currentUser);
		await this.bookingsMapper.mapDynamicValuesRequest(bookingRequest, updatedBooking, validator);

		updatedBooking.serviceProvider = await this.serviceProviderRepo.getServiceProvider({
			id: updatedBooking.serviceProviderId,
		});
		await afterMap(updatedBooking, updatedBooking.serviceProvider);
		await validator.validate(updatedBooking);
		const changeLogAction = updatedBooking.getUpdateChangeType(previousBooking);
		await this.loadBookingDependencies(updatedBooking);
		await this.verifyActionPermission(updatedBooking, changeLogAction);
		await this.bookingsRepository.update(updatedBooking);
		updatedBooking.creator = await this.usersService.persistUserIfRequired(currentUser);

		return [changeLogAction, updatedBooking];
	}

	private static getBookingCreationStatus(
		currentUser: User,
		serviceProvider?: ServiceProvider,
		validationType?: BookingValidationType,
	): BookingStatus {
		return this.shouldAutoAccept(currentUser, serviceProvider, undefined, validationType)
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

	private async bookingRequestExtraction(
		bookingRequest: BookingRequest,
		serviceId: number,
	): Promise<BookingRequestExtraction> {
		const currentUser = await this.userContext.getCurrentUser();
		const isAdminUser = currentUser.isAdmin();
		const isAgencyUser = currentUser.isAgency();
		const service: Service = await this.servicesService.getService(serviceId);
		const isOnHold = service.isOnHold;
		const isStandAlone = service.isStandAlone;
		const videoConferenceUrl = bookingRequest.videoConferenceUrl?.length
			? bookingRequest.videoConferenceUrl
			: service.videoConferenceUrl;

		return {
			currentUser,
			isAdminUser,
			isAgencyUser,
			service,
			isOnHold,
			isStandAlone,
			videoConferenceUrl,
		} as BookingRequestExtraction;
	}

	private async saveInternal(
		bookingRequest: BookingRequest,
		serviceId: number,
		shouldBypassCaptchaAndAutoAccept = false,
	): Promise<[ChangeLogAction, Booking]> {
		const {
			currentUser,
			isAdminUser,
			isAgencyUser,
			service,
			isOnHold,
			isStandAlone,
			videoConferenceUrl,
		} = await this.bookingRequestExtraction(bookingRequest, serviceId);
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

		const isServiceOnHold = () => {
			if (isAdminUser || isAgencyUser) return false;
			return isOnHold || isStandAlone;
		};

		const myInfo = isStandAlone ? await this.myInfoService.getMyInfo(currentUser) : undefined;

		const booking = new BookingBuilder()
			.withServiceId(serviceId)
			.withStartDateTime(bookingRequest.startDateTime)
			.withEndDateTime(bookingRequest.endDateTime)
			.withServiceProviderId(serviceProvider?.id)
			.withRefId(bookingRequest.refId)
			.withLocation(bookingRequest.location)
			.withDescription(bookingRequest.description)
			.withVideoConferenceUrl(videoConferenceUrl)
			.withCreator(currentUser)
			.withCitizenUinFin(BookingsMapper.getCitizenUinFin(currentUser, bookingRequest))
			.withCitizenName(myInfo ? myInfo.data.name.value : bookingRequest.citizenName)
			.withCitizenPhone(myInfo ? myInfo.data.mobileno.nbr.value : bookingRequest.citizenPhone)
			.withCitizenEmail(myInfo ? myInfo.data.email.value : bookingRequest.citizenEmail)
			.withAutoAccept(
				BookingsService.shouldAutoAccept(
					currentUser,
					serviceProvider,
					shouldBypassCaptchaAndAutoAccept,
					bookingRequest.validationType,
				),
			)
			.withMarkOnHold(isServiceOnHold())
			.withCaptchaToken(bookingRequest.captchaToken)
			.build();

		const validator = this.bookingsValidatorFactory.getValidator(useAdminValidator);
		validator.bypassCaptcha(shouldBypassCaptchaAndAutoAccept);
		await this.bookingsMapper.mapDynamicValuesRequest(bookingRequest, booking, validator);

		booking.serviceProvider = serviceProvider;
		await this.loadBookingDependencies(booking);
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

			const validator = this.bookingsValidatorFactory.getOnHoldValidator();
			await this.bookingsMapper.mapDynamicValuesRequest(bookingRequest, updatedBooking, validator);

			if (serviceProvider && serviceProvider.autoAcceptBookings) {
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

	public async validateOnHoldBooking(bookingId: number, bookingRequest: BookingDetailsRequest): Promise<Booking> {
		const validateAction = (_booking) => this.validateOnHoldBookingInternal(_booking, bookingRequest);
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
}

export type BookingRequestExtraction = {
	currentUser: User;
	isAdminUser: Boolean;
	isAgencyUser: Boolean;
	service: Service;
	isOnHold: boolean;
	isStandAlone: boolean;
	videoConferenceUrl: string;
};
