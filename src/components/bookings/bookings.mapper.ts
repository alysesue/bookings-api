import { Booking, ServiceProvider } from '../../models/entities';
import { BookingProviderResponse, BookingResponse } from './bookings.apicontract';

export class BookingsMapper {
	private constructor() {}
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
			serviceProviderName: booking.serviceProvider?.name,
			requestedAt: booking.createdAt,
			citizenUinFin: booking.citizenUinFin,
			citizenEmail: booking.citizenEmail,
			citizenPhone: booking.citizenPhone,
			citizenName: booking.citizenName,
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
}
