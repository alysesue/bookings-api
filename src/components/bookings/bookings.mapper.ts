import { Booking, ServiceProvider } from '../../models/entities';
import { UsersService } from '../users/users.service';
import {
	BookingDetailsRequest,
	BookingProviderResponse,
	BookingRequest,
	BookingResponse,
} from './bookings.apicontract';

export class BookingsMapper {
	public static mapDataModels(bookings: Booking[]): BookingResponse[] {
		return bookings?.map(this.mapDataModel);
	}

	public static mapDataModel(booking: Booking): BookingResponse {
		return {
			id: booking.id,
			status: booking.status,
			startDateTime: booking.startDateTime,
			endDateTime: booking.endDateTime,
			serviceId: booking.serviceId,
			serviceName: booking.service?.name,
			serviceProviderId: booking.serviceProviderId,
			serviceProviderAgencyUserId: booking.serviceProvider?.agencyUserId,
			serviceProviderName: booking.serviceProvider?.name,
			serviceProviderEmail: booking.serviceProvider?.email,
			serviceProviderPhone: booking.serviceProvider?.phone,
			citizenUinFin: UsersService.maskNRIC(booking.citizenUinFin),
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

	public static mapBookingDetails(request: BookingDetailsRequest, booking: Booking) {
		booking.refId = request.refId;
		booking.citizenUinFin = request.citizenUinFin;
		booking.citizenName = request.citizenName;
		booking.citizenEmail = request.citizenEmail;
		booking.citizenPhone = request.citizenPhone;
		booking.location = request.location;
		booking.description = request.description;
	}

	public static mapRequest(request: BookingRequest, booking: Booking) {
		this.mapBookingDetails(request, booking);
		booking.startDateTime = request.startDateTime;
		booking.endDateTime = request.endDateTime;
		booking.serviceProviderId = request.serviceProviderId;
		booking.captchaToken = request.captchaToken;
		booking.captchaOrigin = request.captchaOrigin;
	}
}
