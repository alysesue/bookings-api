import { Booking, BookingStatus } from '../../../models';
import { Inject, InRequestScope } from 'typescript-ioc';
import { ServiceProvidersRepository } from '../../serviceProviders/serviceProviders.repository';
import { DateHelper } from '../../../infrastructure/dateHelper';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { BookingSearchQuery, BookingsRepository } from '../bookings.repository';
import { UnavailabilitiesService } from '../../unavailabilities/unavailabilities.service';
import { TimeslotsService } from '../../timeslots/timeslots.service';
import { isEmail, isSGUinfin } from 'mol-lib-api-contract/utils';

export interface IValidator {
	validate(booking: Booking);
}

@InRequestScope
abstract class BookingsValidator implements IValidator {
	protected static OverlapsAcceptedBooking = `Booking request not valid as it overlaps another accepted booking`;
	protected static ServiceProviderNotAvailable = `The service provider is not available in the selected time range`;
	protected static ServiceProvidersNotAvailable = `No available service providers in the selected time range`;
	private static EndTimeLesserThanStartTime = 'End time for booking must be greater than start time';
	private static CitizenUinFinNotFound = 'Citizen Uin/Fin not found';
	private static CitizenNameNotProvided = 'Citizen name not provided';
	private static CitizenEmailNotProvided = 'Citizen email not provided';
	private static CitizenEmailNotValid = 'Citizen email not valid';

	@Inject
	private serviceProvidersRepository: ServiceProvidersRepository;

	private static ServiceProviderNotFound = (spId) => `Service provider '${spId}' not found`;

	private static async validateUinFin(citizenUinFin: string) {
		const validUinFin = await isSGUinfin(citizenUinFin);
		return validUinFin.pass;
	}

	private static async validateCitizenDetails(booking: Booking) {
		if (!(await BookingsValidator.validateUinFin(booking.citizenUinFin))) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(BookingsValidator.CitizenUinFinNotFound);
		}

		if (!booking.citizenName) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(BookingsValidator.CitizenNameNotProvided);
		}

		if (!booking.citizenEmail) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(BookingsValidator.CitizenEmailNotProvided);
		}

		if (!(await isEmail(booking.citizenEmail)).pass) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(BookingsValidator.CitizenEmailNotValid);
		}
	}

	private static validateDuration(booking: Booking): void {
		const duration = Math.floor(DateHelper.DiffInMinutes(booking.endDateTime, booking.startDateTime));

		if (duration <= 0) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(
				BookingsValidator.EndTimeLesserThanStartTime,
			);
		}
	}

	public async validate(booking: Booking): Promise<void> {
		BookingsValidator.validateDuration(booking);
		await this.validateServiceProviderExisting(booking);
		await BookingsValidator.validateCitizenDetails(booking);
		await this.validateAvailability(booking);
	}

	protected abstract async validateAvailability(booking: Booking);

	private async validateServiceProviderExisting(booking: Booking) {
		if (booking.serviceProviderId) {
			const provider = await this.serviceProvidersRepository.getServiceProvider({
				id: booking.serviceProviderId,
			});
			if (!provider) {
				throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(
					BookingsValidator.ServiceProviderNotFound(booking.serviceProviderId),
				);
			}
		}
	}
}

@InRequestScope
class OutOfSlotBookingValidator extends BookingsValidator {
	@Inject
	private bookingsRepository: BookingsRepository;
	@Inject
	private unAvailabilitiesService: UnavailabilitiesService;

	public async validateAvailability(booking: Booking) {
		await this.validateOverlapping(booking);

		if (
			booking.serviceProviderId &&
			(await this.unAvailabilitiesService.isUnavailable({
				from: booking.startDateTime,
				to: booking.endDateTime,
				serviceId: booking.serviceId,
				serviceProviderId: booking.serviceProviderId,
			}))
		) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(
				BookingsValidator.ServiceProviderNotAvailable,
			);
		}
	}

	private async validateOverlapping(booking: Booking): Promise<void> {
		const searchQuery: BookingSearchQuery = {
			from: booking.startDateTime,
			to: booking.endDateTime,
			statuses: [BookingStatus.Accepted],
			serviceId: booking.serviceId,
			serviceProviderId: booking.serviceProviderId,
			byPassAuth: true,
		};

		const acceptedBookings = await this.bookingsRepository.search(searchQuery);

		if (
			acceptedBookings.some((item) =>
				booking.bookingIntersects({
					start: item.startDateTime,
					end: item.endDateTime,
					id: item.id,
				}),
			)
		) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(BookingsValidator.OverlapsAcceptedBooking);
		}
	}
}

@InRequestScope
class SlotBookingsValidator extends BookingsValidator {
	@Inject
	private timeslotsService: TimeslotsService;

	public async validateAvailability(booking: Booking) {
		const timeslotEntry = await this.timeslotsService.getAvailableProvidersForTimeslot(
			booking.startDateTime,
			booking.endDateTime,
			booking.serviceId,
			booking.serviceProviderId,
		);

		if (timeslotEntry.availabilityCount < 1) {
			const errorMessage = booking.serviceProviderId
				? BookingsValidator.ServiceProviderNotAvailable
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

	public getValidator(outOfSlotBooking: boolean): IValidator {
		if (outOfSlotBooking) {
			return this.outOfSlotBookingValidator;
		} else {
			return this.slotBookingValidator;
		}
	}
}
