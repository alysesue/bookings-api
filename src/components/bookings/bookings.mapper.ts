import { Booking, ServiceProvider, User } from '../../models/entities';
import {
	BookingDetailsRequest,
	BookingProviderResponse,
	BookingRequest,
	BookingResponse,
} from './bookings.apicontract';
import { UinFinConfiguration } from '../../models/uinFinConfiguration';
import { UserContextSnapshot } from '../../infrastructure/auth/userContext';
import { Inject, InRequestScope } from 'typescript-ioc';
import { DynamicValuesMapper, DynamicValuesRequestMapper } from '../dynamicFields/dynamicValues.mapper';
import { isErrorResult } from '../../errors';
import { IBookingsValidator } from './validator/bookings.validation';
import * as stringify from 'csv-stringify';
import { BookingStatus, bookingStatusArray } from '../../models/bookingStatus';

// tslint:disable-next-line: tsr-detect-unsafe-regexp
const MASK_UINFIN_REGEX = /(?<=^.{1}).{4}/;
const MASK_REPLACE_VALUE = '*'.repeat(4);

@InRequestScope
export class BookingsMapper {
	@Inject
	private dynamicValuesMapper: DynamicValuesMapper;
	@Inject
	private dynamicValuesRequestMapper: DynamicValuesRequestMapper;

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

	public maskUinFin(booking: Booking, userContext: UserContextSnapshot): string {
		if (!booking.service?.organisation) {
			throw new Error('Booking -> service -> organisation not loaded. BookingsMapper requires it.');
		}

		if (!booking.citizenUinFin) {
			return booking.citizenUinFin;
		}

		const uinFinConfig = new UinFinConfiguration(booking.service.organisation);
		if (uinFinConfig.canViewPlainUinFin(userContext)) {
			return booking.citizenUinFin;
		}

		return booking.citizenUinFin.replace(MASK_UINFIN_REGEX, MASK_REPLACE_VALUE);
	}

	public mapDataModels(bookings: Booking[], userContext: UserContextSnapshot): BookingResponse[] {
		return bookings?.map((booking) => {
			return this.mapDataModel(booking, userContext);
		});
	}

	// TODO: no need to pass in userContext, Inject it instead
	public mapDataModel(booking: Booking, userContext: UserContextSnapshot): BookingResponse {
		const response: BookingResponse = {
			id: booking.id,
			status: booking.status,
			createdDateTime: booking.createdLog?.timestamp,
			startDateTime: booking.startDateTime,
			endDateTime: booking.endDateTime,
			serviceId: booking.serviceId,
			serviceName: booking.service?.name,
			serviceProviderId: booking.serviceProviderId,
			serviceProviderAgencyUserId: booking.serviceProvider?.agencyUserId,
			serviceProviderName: booking.serviceProvider?.name,
			serviceProviderEmail: booking.serviceProvider?.email,
			serviceProviderPhone: booking.serviceProvider?.phone,
			citizenUinFin: this.maskUinFin(booking, userContext),
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
		};
		return response;
	}

	public async mapBookingsCSV(bookings: Booking[], userContext: UserContextSnapshot): Promise<string> {
		const bookingsCSV = bookings.map((booking) => this.mapDataCSV(booking, userContext));
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

	public mapDataCSV(booking: Booking, userContext: UserContextSnapshot): {} {
		const dynamicValues = booking.dynamicValues?.map(
			(item) => `${item.fieldName}:${this.dynamicValuesMapper.getValueAsString(item)}`,
		);
		const bookingDetails = {
			['Booking ID']: `${booking.id.toString()}`,
			['Booking Status']: `${BookingStatus[booking.status]}`,
			['Booking creation date']: `${booking.createdLog?.timestamp.toString()}`,
			['Booking service start date/time']: `${booking.startDateTime.toString()}`,
			['Booking service end date/time']: `${booking.endDateTime.toString()}`,
			['Booking location']: `${booking.location}`,
			['Booking description']: `${booking.description}`,
			['Booking reference']: `${booking.refId}`,
			['Dynamic Fields']: `${dynamicValues?.join('; ')}`,
			['Citizen FIN number']: `${this.maskUinFin(booking, userContext)}`,
			['Citizen Name']: `${booking.citizenName}`,
			['Citizen Email address']: `${booking.citizenEmail}`,
			['Citizen Phone number']: `${booking.citizenPhone}`,
			['Service Name']: `${booking.service.name}`,
			['Service Provider Name']: `${booking.serviceProvider?.name}`,
			['Service Provider Email address']: `${booking.serviceProvider?.email}`,
			['Service Provider Phone number']: `${booking.serviceProvider?.phone}`,
		};

		return bookingDetails;
	}

	public static mapProvider(provider: ServiceProvider): BookingProviderResponse {
		return {
			id: provider.id,
			name: provider.name,
		} as BookingProviderResponse;
	}

	public static getCitizenUinFin(currentUser: User, bookingRequest: BookingDetailsRequest): string {
		if (currentUser && currentUser.isCitizen()) {
			return currentUser.singPassUser.UinFin;
		}
		return bookingRequest.citizenUinFin;
	}

	public static mapBookingDetails(request: BookingDetailsRequest, booking: Booking, user: User) {
		booking.refId = request.refId;
		booking.citizenUinFin = this.getCitizenUinFin(user, request);
		booking.citizenName = request.citizenName;
		booking.citizenEmail = request.citizenEmail;
		booking.citizenPhone = request.citizenPhone;
		booking.location = request.location;
		booking.description = request.description;
		booking.videoConferenceUrl = request.videoConferenceUrl;
	}

	public static mapRequest(request: BookingRequest, booking: Booking, user: User) {
		this.mapBookingDetails(request, booking, user);
		booking.startDateTime = request.startDateTime;
		booking.endDateTime = request.endDateTime;
		booking.serviceProviderId = request.serviceProviderId;
		booking.captchaToken = request.captchaToken;
		booking.captchaOrigin = request.captchaOrigin;
	}

	public mapStatuses(): number[] {
		return bookingStatusArray.map((value) => value);
	}
}
