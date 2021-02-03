import { Booking, ServiceProvider, User } from '../../models/entities';
import {
	BookingDetailsRequest,
	BookingProviderResponse,
	BookingRequest,
	BookingResponse,
} from './bookings.apicontract';

const asterisk = '*';

export class BookingsMapper {
	public static maskNRIC(nricStr: string, currentUser: User): string {
		if (!nricStr || currentUser.isAgency()) {
			return nricStr;
		}

		// tslint:disable-next-line: tsr-detect-unsafe-regexp
		const re = /(?<=^.{1}).{4}/;
		return nricStr.replace(re, asterisk.repeat(4));
	}

	public static mapDataModels(bookings: Booking[], currentUser: User): BookingResponse[] {
		return bookings?.map((booking) => {
			return this.mapDataModel(booking, currentUser);
		});
	}

	public static mapDataModel(booking: Booking, currentUser: User): BookingResponse {
		return {
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
			citizenUinFin: BookingsMapper.maskNRIC(booking.citizenUinFin, currentUser),
			citizenName: booking.citizenName,
			citizenEmail: booking.citizenEmail,
			citizenPhone: booking.citizenPhone,
			location: booking.location,
			description: booking.description,
			refId: booking.refId,
		} as BookingResponse;
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
	}

	public static mapRequest(request: BookingRequest, booking: Booking, user: User) {
		this.mapBookingDetails(request, booking, user);
		booking.startDateTime = request.startDateTime;
		booking.endDateTime = request.endDateTime;
		booking.serviceProviderId = request.serviceProviderId;
		booking.captchaToken = request.captchaToken;
		booking.captchaOrigin = request.captchaOrigin;
	}
}
