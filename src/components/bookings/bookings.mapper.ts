import { Booking, Service, ServiceProvider } from '../../models/entities';
import {
	BookingDetailsRequest,
	BookingProviderResponseV1,
	BookingProviderResponseV2,
	BookingRequestV1,
	BookingResponseBase,
	BookingResponseV1,
	BookingResponseV2,
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

// tslint:disable-next-line: tsr-detect-unsafe-regexp
const MASK_UINFIN_REGEX = /(?<=^.{1}).{4}/;
const MASK_REPLACE_VALUE = '*'.repeat(4);

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

	public async mapDynamicValuesRequest(
		bookingRequest: BookingDetailsRequest,
		booking: Booking,
		validator: IBookingsValidator,
	): Promise<void> {
		if (!bookingRequest.dynamicValuesUpdated || !bookingRequest.dynamicValues) {
			return;
		}

		const mapResult = await this.dynamicValuesRequestMapper.mapDynamicValuesRequest(
			bookingRequest.dynamicValues,
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

	public async mapDataModelV1(booking: Booking): Promise<BookingResponseV1> {
		const bookingResponse = await this.mapDataModelBase(booking);
		const bookingId = booking.id;
		const serviceId = booking.serviceId;
		const serviceProviderId = booking.serviceProviderId;
		return { ...bookingResponse, id: bookingId, serviceId, serviceProviderId };
	}

	public async mapDataModelV2(booking: Booking): Promise<BookingResponseV2> {
		const bookingResponse = await this.mapDataModelBase(booking);
		const signedBookingId = this.idHasher.encode(booking.id);
		const signedServiceId = this.idHasher.encode(booking.serviceId);
		const signedServiceProviderId = this.idHasher.encode(booking.serviceProviderId);
		return {
			...bookingResponse,
			id: signedBookingId,
			serviceId: signedServiceId,
			serviceProviderId: signedServiceProviderId,
		};
	}

	private async mapDataModelBase(booking: Booking): Promise<BookingResponseBase> {
		return {
			status: booking.status,
			createdDateTime: booking.createdLog?.timestamp,
			startDateTime: booking.startDateTime,
			endDateTime: booking.endDateTime,
			serviceName: booking.service?.name,
			serviceProviderAgencyUserId: booking.serviceProvider?.agencyUserId,
			serviceProviderName: booking.serviceProvider?.name,
			serviceProviderEmail: booking.serviceProvider?.email,
			serviceProviderPhone: booking.serviceProvider?.phone,
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
		};
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

	private async getCitizenUinFin(bookingRequest: BookingDetailsRequest): Promise<string> {
		const currentUser = await this.userContext.getCurrentUser();
		if (currentUser && currentUser.isCitizen()) {
			return currentUser.singPassUser.UinFin;
		}
		return bookingRequest.citizenUinFin;
	}

	public async mapBookingDetails({
		request,
		booking,
		service,
	}: {
		service: Service;
		request: BookingDetailsRequest;
		booking: Booking;
	}): Promise<void> {
		const isNew = !booking.id;
		if (isNew) {
			booking.serviceId = service.id;
		}

		booking.refId = request.refId;
		booking.citizenUinFin = await this.getCitizenUinFin(request);
		booking.citizenName = request.citizenName;
		booking.citizenEmail = request.citizenEmail;
		booking.citizenPhone = request.citizenPhone;
		booking.location = request.location;
		booking.description = request.description;

		booking.videoConferenceUrl = request.videoConferenceUrl || service.videoConferenceUrl;

		const myInfo = service.isStandAlone ? await this.userContext.getMyInfo() : undefined;
		if (myInfo) {
			booking.citizenName = myInfo.data.name.value;
			booking.citizenEmail = request.citizenEmail || myInfo.data.email.value;
			booking.citizenPhone = request.citizenPhone || myInfo.data.mobileno.nbr.value;
		}

		const mobileNo = this.userContext.getOtpAddOnMobileNo();
		if (mobileNo) {
			booking.citizenPhone = mobileNo;
		}
	}

	public async mapRequest({
		request,
		booking,
		service,
	}: {
		request: BookingRequestV1;
		booking: Booking;
		service: Service;
	}): Promise<void> {
		await this.mapBookingDetails({ request, booking, service });
		booking.startDateTime = request.startDateTime;
		booking.endDateTime = request.endDateTime;
		booking.serviceProviderId = request.serviceProviderId;
		booking.captchaToken = request.captchaToken;
	}

	public mapStatuses(): number[] {
		return bookingStatusArray.map((value) => value);
	}
}
