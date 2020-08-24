import { InRequestScope } from "typescript-ioc";
import {Booking, ServiceProvider} from "../../models/entities";
import {BookingProviderResponse, BookingResponse} from "./bookings.apicontract";

@InRequestScope
export class BookingsMapper {
    public mapDataModels(bookings: Booking[]): BookingResponse[] {
        return bookings?.map(this.mapDataModel);
    }

    public mapDataModel(booking: Booking): BookingResponse {
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
        } as BookingResponse;
    }

    public mapProvider(provider: ServiceProvider): BookingProviderResponse {
        return {
            id: provider.id,
            name: provider.name
        } as BookingProviderResponse;
    }
}
