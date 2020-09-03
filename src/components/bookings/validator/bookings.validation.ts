import { Booking, BookingStatus } from "../../../models";
import { Inject, InRequestScope } from "typescript-ioc";
import { ServiceProvidersRepository } from "../../serviceProviders/serviceProviders.repository";
import { DateHelper } from "../../../infrastructure/dateHelper";
import { ErrorCodeV2, MOLErrorV2 } from "mol-lib-api-contract";
import { BookingsRepository } from "../bookings.repository";
import { UnavailabilitiesService } from "../../unavailabilities/unavailabilities.service";
import { TimeslotsService } from "../../timeslots/timeslots.service";
import { BookingSearchRequest } from "../bookings.apicontract";
import { QueryAccessType } from "../../../core/repository";

interface IValidator {
	validate(booking: Booking);
}

@InRequestScope
abstract class BookingsValidator implements IValidator {

	protected static OverlapsAcceptedBooking = `Booking request not valid as it overlaps another accepted booking`;
	protected static ServiceProviderNotAvailable = `The service provider is not available in the selected time range`;
	protected static ServiceProvidersNotAvailable = `No available service providers in the selected time range`;
	private static EndTimeLesserThanStartTime = 'End time for booking must be greater than start time';
	private static CitizenUinFinNotFound = 'Citizen Uin/Fin not found';

	@Inject
	private serviceProvidersRepository: ServiceProvidersRepository

	private static ServiceProviderNotFound = (spId) => `Service provider '${spId}' not found`;

	private static validateUinFin(citizenUinFin: string) {
		return !citizenUinFin;
	}

	public async validate(booking: Booking) {
		const duration = Math.floor(DateHelper.DiffInMinutes(booking.endDateTime, booking.startDateTime));

		if (duration <= 0) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(BookingsValidator.EndTimeLesserThanStartTime);
		}

		if (booking.serviceProviderId) {
			const provider = await this.serviceProvidersRepository.getServiceProvider({id: booking.serviceProviderId});
			if (!provider) {
				throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(BookingsValidator.ServiceProviderNotFound(booking.serviceProviderId));
			}
		}

		if (BookingsValidator.validateUinFin(booking.citizenUinFin)) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(BookingsValidator.CitizenUinFinNotFound);
		}

		await this.validateBooking(booking);
	}

	protected abstract async validateBooking(booking: Booking);
}

@InRequestScope
class OutOfSlotBookingValidator extends BookingsValidator {

	@Inject
	private bookingsRepository: BookingsRepository;
	@Inject
	private unAvailabilitiesService: UnavailabilitiesService;

	async validateBooking(booking: Booking): Promise<void> {
		const {startDateTime, endDateTime, serviceId, serviceProviderId} = booking;

		const searchQuery = new BookingSearchRequest(startDateTime, endDateTime, [BookingStatus.Accepted], serviceId, serviceProviderId);

		const acceptedBookings = await this.bookingsRepository.search(searchQuery, QueryAccessType.Read);

		if (acceptedBookings.some(item => booking.bookingIntersects({
			start: item.startDateTime,
			end: item.endDateTime
		}))) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(BookingsValidator.OverlapsAcceptedBooking);
		}

		if (booking.serviceProviderId && await this.unAvailabilitiesService.isUnavailable({
			from: startDateTime,
			to: endDateTime,
			serviceId: booking.serviceId,
			serviceProviderId: booking.serviceProviderId
		})) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(BookingsValidator.ServiceProviderNotAvailable);
		}
	}
}

@InRequestScope
class SlotBookingsValidator extends BookingsValidator {

	@Inject
	private timeslotsService: TimeslotsService;

	async validateBooking(booking: Booking): Promise<void> {
		const timeslotEntry = await this.timeslotsService.getAvailableProvidersForTimeslot(booking.startDateTime, booking.endDateTime, booking.serviceId, booking.serviceProviderId);

		if (timeslotEntry.availabilityCount < 1) {
			const errorMessage = booking.serviceProviderId ? BookingsValidator.ServiceProviderNotAvailable
				: BookingsValidator.ServiceProvidersNotAvailable;
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(errorMessage);
		}
	}
}

@InRequestScope
export class BookingsValidatorFactory {

	@Inject
	private slotBookingValidator: SlotBookingsValidator;
	@Inject
	private outOfSlotBookingValidator: OutOfSlotBookingValidator;

	public getValidator(outOfSlotBooking: boolean) {
		if (outOfSlotBooking) {
			return this.outOfSlotBookingValidator;
		} else {
			return this.slotBookingValidator;
		}
	}
}
