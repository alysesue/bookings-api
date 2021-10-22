import { BookedSlot, Booking, Event, Service, ServiceProvider } from '../../models/entities';
import {
	BookingDetailsRequest,
	BookingProviderResponseV1,
	BookingProviderResponseV2,
	BookingRequestV1,
	BookingResponseBase,
	BookingResponseV1,
	BookingResponseV2,
	EventBookingRequest,
	EventBookingResponse,
} from './bookings.apicontract';
import { UinFinConfiguration } from '../../models/uinFinConfiguration';
import { UserContext } from '../../infrastructure/auth/userContext';
import { Inject, InRequestScope } from 'typescript-ioc';
import { DynamicValuesMapper, DynamicValuesRequestMapper } from '../dynamicFields/dynamicValues.mapper';
import { isErrorResult } from '../../errors';
import { IBookingsValidator } from './validator/bookings.validation';
import * as stringify from 'csv-stringify';
import { BookingStatus, bookingStatusArray } from '../../models/bookingStatus';
import { IdHasher } from '../../infrastructure/idHasher';
import { EventsMapper } from '../events/events.mapper';

// tslint:disable-next-line: tsr-detect-unsafe-regexp
const MASK_UINFIN_REGEX = /(?<=^.{1}).{4}/;
const MASK_REPLACE_VALUE = '*'.repeat(4);

export type BookingMapDetails = BookingDetailsRequest & { citizenUinFinUpdated: boolean };

@InRequestScope
export class BookingsMapper {
	@Inject
	private dynamicValuesMapper: DynamicValuesMapper;
	@Inject
	private dynamicValuesRequestMapper: DynamicValuesRequestMapper;

	@Inject
	private idHasher: IdHasher;
	@Inject
	private userContext: UserContext;
	@Inject
	private eventsMapper: EventsMapper;

	public async mapDynamicValuesRequest(
		bookingRequest: BookingDetailsRequest,
		booking: Booking,
		validator: IBookingsValidator,
	): Promise<void> {
		if (!bookingRequest.dynamicValuesUpdated || !bookingRequest.dynamicValues) {
			return;
		}

		const mapResult = await this.dynamicValuesRequestMapper.mapDynamicValues(
			bookingRequest.dynamicValues,
			booking.dynamicValues || [],
			booking.serviceId,
		);
		if (isErrorResult(mapResult)) {
			validator.addCustomCitizenValidations(...mapResult.errorResult);
		} else {
			booking.dynamicValues = mapResult.result;
		}
	}

	public async maskUinFin(booking: Booking): Promise<string> {
		if (!booking.service?.organisation) {
			throw new Error('Booking -> service -> organisation not loaded. BookingsMapper requires it.');
		}

		if (!booking.citizenUinFin) {
			return booking.citizenUinFin;
		}

		const uinFinConfig = new UinFinConfiguration(booking.service.organisation);
		if (uinFinConfig.canViewPlainUinFin(await this.userContext.getSnapshot())) {
			return booking.citizenUinFin;
		}

		return booking.citizenUinFin.replace(MASK_UINFIN_REGEX, MASK_REPLACE_VALUE);
	}

	public async mapDataModelsV1(bookings: Booking[]): Promise<BookingResponseV1[]> {
		const bookingsResult = [];
		for (const booking of bookings) {
			await this.mapDataModelV1(booking);
			bookingsResult.push(booking);
		}
		return bookingsResult;
	}

	public async mapDataModelsV2(bookings: Booking[]): Promise<BookingResponseV2[]> {
		const bookingsResult = [];
		for (const booking of bookings) {
			await this.mapDataModelV2(booking);
			bookingsResult.push(booking);
		}
		return bookingsResult;
	}

	public async mapDataModelV1(booking: Booking, { mapUUID }: { mapUUID?: boolean } = {}): Promise<BookingResponseV1> {
		const bookingResponse = await this.mapDataModelBase(booking, { mapUUID });
		const bookingId = booking.id;
		const serviceId = booking.serviceId;
		const serviceProviderId = booking.serviceProviderId;
		const startDateTime = booking.startDateTime;
		const endDateTime = booking.endDateTime;
		const serviceProviderAgencyUserId = booking.serviceProvider?.agencyUserId;
		const serviceProviderName = booking.serviceProvider?.name;
		const serviceProviderEmail = booking.serviceProvider?.email;
		const serviceProviderPhone = booking.serviceProvider?.phone;

		return {
			...bookingResponse,
			id: bookingId,
			serviceId,
			serviceProviderId,
			startDateTime,
			endDateTime,
			serviceProviderAgencyUserId,
			serviceProviderName,
			serviceProviderEmail,
			serviceProviderPhone,
		};
	}

	public async mapDataModelV2(booking: Booking, { mapUUID }: { mapUUID?: boolean } = {}): Promise<BookingResponseV2> {
		const bookingResponse = await this.mapDataModelBase(booking, { mapUUID });
		const signedBookingId = this.idHasher.encode(booking.id);
		const signedServiceId = this.idHasher.encode(booking.serviceId);
		const signedServiceProviderId = this.idHasher.encode(booking.serviceProviderId);
		const startDateTime = booking.startDateTime;
		const endDateTime = booking.endDateTime;
		const serviceProviderAgencyUserId = booking.serviceProvider?.agencyUserId;
		const serviceProviderName = booking.serviceProvider?.name;
		const serviceProviderEmail = booking.serviceProvider?.email;
		const serviceProviderPhone = booking.serviceProvider?.phone;

		return {
			...bookingResponse,
			id: signedBookingId,
			serviceId: signedServiceId,
			serviceProviderId: signedServiceProviderId,
			startDateTime,
			endDateTime,
			serviceProviderAgencyUserId,
			serviceProviderName,
			serviceProviderEmail,
			serviceProviderPhone,
		};
	}

	private async mapDataModelBase(booking: Booking, { mapUUID }: { mapUUID?: boolean }): Promise<BookingResponseBase> {
		const response: BookingResponseBase = {
			status: booking.status,
			createdDateTime: booking.createdLog?.timestamp,
			serviceName: booking.service?.name,
			citizenUinFin: await this.maskUinFin(booking),
			citizenName: booking.citizenName,
			citizenEmail: booking.citizenEmail,
			citizenPhone: booking.citizenPhone,
			location: booking.location,
			description: booking.description,
			videoConferenceUrl: booking.videoConferenceUrl,
			refId: booking.refId,
			dynamicValues: this.dynamicValuesMapper.mapDynamicValuesModel(booking.dynamicValues),
			serviceProviderAliasName: booking.serviceProvider?.aliasName,
			reasonToReject: booking.reasonToReject,
			sendNotifications: booking.service?.sendNotifications,
			sendSMSNotifications: booking.service?.sendSMSNotifications,
			event: booking.event ? this.eventsMapper.mapToResponse(booking.event) : undefined,
		};

		if (mapUUID) {
			response.uuid = booking.uuid;
		}
		return response;
	}

	public async mapBookingsCSV(bookings: Booking[]): Promise<string> {
		const bookingsCSV = [];
		for (const booking of bookings) {
			const mappedBooking = await this.mapDataCSV(booking);
			bookingsCSV.push(mappedBooking);
		}
		return new Promise<string>((resolve, reject) => {
			stringify(
				bookingsCSV,
				{
					header: true,
				},
				function (err, data) {
					if (err) {
						reject(err);
					}
					resolve(data);
				},
			);
		});
	}

	public async mapDataCSV(booking: Booking): Promise<{}> {
		const dynamicValues = booking.dynamicValues?.map(
			(item) => `${item.fieldName}:${this.dynamicValuesMapper.getValueAsString(item)}`,
		);
		return {
			['Booking ID']: `${booking.id.toString()}`,
			['Booking Status']: `${BookingStatus[booking.status]}`,
			['Booking creation date']: `${booking.createdLog?.timestamp.toString()}`,
			['Booking service start date/time']: `${booking.startDateTime.toString()}`,
			['Booking service end date/time']: `${booking.endDateTime.toString()}`,
			['Booking location']: `${booking.location}`,
			['Booking description']: `${booking.description}`,
			['Booking reference']: `${booking.refId}`,
			['Dynamic Fields']: `${dynamicValues?.join('; ')}`,
			['Citizen NRIC / FIN number']: `${await this.maskUinFin(booking)}`,
			['Citizen Name']: `${booking.citizenName}`,
			['Citizen Email address']: `${booking.citizenEmail}`,
			['Citizen Phone number']: `${booking.citizenPhone}`,
			['Service Name']: `${booking.service.name}`,
			['Service Provider Name']: `${booking.serviceProvider?.name}`,
			['Service Provider Email address']: `${booking.serviceProvider?.email}`,
			['Service Provider Phone number']: `${booking.serviceProvider?.phone}`,
		};
	}

	public mapProviderV1(provider: ServiceProvider): BookingProviderResponseV1 {
		return {
			id: provider.id,
			name: provider.name,
		};
	}

	public mapProviderV2(provider: ServiceProvider): BookingProviderResponseV2 {
		const signedId = this.idHasher.encode(provider.id);
		return {
			id: signedId,
			name: provider.name,
		};
	}

	public async mapBookingDetails({
		request,
		booking,
		service,
	}: {
		service: Service;
		request: BookingMapDetails;
		booking: Booking;
	}): Promise<void> {
		const isNew = !booking.id;
		if (isNew) {
			booking.serviceId = service.id;
		}

		booking.refId = request.refId;
		if (request.citizenUinFinUpdated) {
			booking.citizenUinFin = request.citizenUinFin;
		}

		booking.citizenName = request.citizenName;
		booking.citizenEmail = request.citizenEmail;
		booking.citizenPhone = request.citizenPhone;
		booking.location = request.location;
		booking.description = request.description;

		booking.videoConferenceUrl = request.videoConferenceUrl || service.videoConferenceUrl;

		await this.updateDetailsFromUser({ booking, service });
	}

	public async updateDetailsFromUser({ booking, service }: { service: Service; booking: Booking }): Promise<void> {
		// Place all logic to update booking details from user context information here.

		const currentUser = await this.userContext.getCurrentUser();
		if (currentUser && currentUser.isSingPass()) {
			booking.citizenUinFin = currentUser.singPassUser.UinFin;
		}

		booking.dynamicValues = await this.dynamicValuesRequestMapper.updateMyInfoDynamicFromUser(
			booking.dynamicValues,
			booking.serviceId,
		);

		const myInfo = service.isStandAlone ? await this.userContext.getMyInfo() : undefined;
		if (myInfo) {
			booking.citizenName = myInfo.name.value;
			booking.citizenEmail = booking.citizenEmail || myInfo.email.value;
			booking.citizenPhone = booking.citizenPhone || myInfo.mobileno.nbr.value;
		}

		const mobileNo = this.userContext.getOtpAddOnMobileNo();
		if (mobileNo) {
			booking.citizenPhone = mobileNo;
		}
	}

	public async mapEventBookingRequests({
		request,
		booking,
		service,
		event,
	}: {
		request: EventBookingRequest & { citizenUinFinUpdated: boolean };
		booking: Booking;
		service: Service;
		event: Event;
	}): Promise<void> {
		await this.mapBookingDetails({ request, booking, service });
		booking.eventId = event.id;
		booking.bookedSlots = event.oneOffTimeslots.map((slot) => {
			const entity = new BookedSlot();
			entity.startDateTime = slot.startDateTime;
			entity.endDateTime = slot.endDateTime;
			entity.serviceProviderId = slot.serviceProviderId;
			return entity;
		});
		booking.startDateTime = booking.bookedSlots[0].startDateTime;
		booking.endDateTime = booking.bookedSlots[0].endDateTime;
		booking.captchaToken = request.captchaToken;
	}

	public async mapRequest({
		request,
		booking,
		service,
	}: {
		request: BookingRequestV1 & { citizenUinFinUpdated: boolean };
		booking: Booking;
		service: Service;
	}): Promise<void> {
		await this.mapBookingDetails({ request, booking, service });
		const bookedSlots = [];
		const bookedSlot = new BookedSlot();
		bookedSlot.startDateTime = request.startDateTime;
		bookedSlot.endDateTime = request.endDateTime;
		bookedSlot.serviceProviderId = request.serviceProviderId;
		bookedSlots.push(bookedSlot);

		booking.startDateTime = request.startDateTime;
		booking.endDateTime = request.endDateTime;
		booking.bookedSlots = bookedSlots;
		booking.serviceProviderId = request.serviceProviderId;
		booking.captchaToken = request.captchaToken;
	}

	public mapStatuses(): number[] {
		return bookingStatusArray.map((value) => value);
	}

	private mapBookedSlots(bookedSlot: any) {
		return {
			startDateTime: bookedSlot.startDateTime,
			endDateTime: bookedSlot.endDateTime,
			serviceProviderId: bookedSlot.serviceProviderId,
		} as BookedSlot;
	}

	public async mapEventsDataModel(booking: Booking): Promise<EventBookingResponse> {
		const response: EventBookingResponse = {
			bookingId: this.idHasher.encode(booking.id),
			eventId: this.idHasher.encode(booking.eventId),
			status: booking.status,
			createdDateTime: booking.createdLog?.timestamp,
			serviceId: booking.serviceId,
			serviceName: booking.service?.name,
			citizenUinFin: await this.maskUinFin(booking),
			citizenName: booking.citizenName,
			citizenEmail: booking.citizenEmail,
			citizenPhone: booking.citizenPhone,
			description: booking.description,
			refId: booking.refId,
			dynamicValues: this.dynamicValuesMapper.mapDynamicValuesModel(booking.dynamicValues),
			sendNotifications: booking.service?.sendNotifications,
			sendSMSNotifications: booking.service?.sendSMSNotifications,
			bookedSlots: booking.bookedSlots.map((slot) => this.mapBookedSlots(slot)),
		} as EventBookingResponse;

		return response;
	}
}
