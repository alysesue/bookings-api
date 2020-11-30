import { BusinessValidation } from '../../../models';

/** Reserved BookingBusinessValidations range: 10001 - 10199 */
export class BookingBusinessValidations {
	private constructor() {}

	public static readonly ServiceProviderNotAvailable = new BusinessValidation({
		code: '10001',
		message: `The service provider is not available in the selected time range`,
	});

	public static readonly ServiceProvidersNotAvailable = new BusinessValidation({
		code: '10002',
		message: `No available service providers in the selected time range`,
	});

	public static readonly OverlapsAcceptedBooking = new BusinessValidation({
		code: '10003',
		message: `Booking request not valid as it overlaps another accepted booking`,
	});

	public static readonly EndTimeLesserThanStartTime = new BusinessValidation({
		code: '10004',
		message: `End time for booking must be greater than start time`,
	});

	public static readonly CitizenUinFinNotFound = new BusinessValidation({
		code: '10005',
		message: `Citizen Uin/Fin not found`,
	});

	public static readonly CitizenNameNotProvided = new BusinessValidation({
		code: '10006',
		message: `Citizen name not provided`,
	});

	public static readonly CitizenEmailNotProvided = new BusinessValidation({
		code: '10007',
		message: `Citizen email not provided`,
	});

	public static readonly CitizenEmailNotValid = new BusinessValidation({
		code: '10008',
		message: `Citizen email not valid`,
	});

	public static readonly ServiceProviderNotFound = (spId: number) =>
		new BusinessValidation({
			code: '10009',
			message: `Service provider '${spId}' not found`,
		});

	public static readonly OutOfSlotServiceProviderRequired = new BusinessValidation({
		code: '10010',
		message: `Service provider is required for out of slot bookings`,
	});
}