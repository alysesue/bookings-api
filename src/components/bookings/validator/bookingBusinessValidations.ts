import { BusinessValidation } from '../../../models';
import { ErrorsRef } from '../../../errors/errors.ref';

/** Reserved BookingBusinessValidations range: 10001 - 10099 */
export class BookingBusinessValidations {
	private static errors = ErrorsRef().booking;

	public static readonly ServiceProviderNotAvailable = new BusinessValidation(
		BookingBusinessValidations.errors.ServiceProviderNotAvailable,
	);

	public static readonly ServiceProvidersNotAvailable = new BusinessValidation(
		BookingBusinessValidations.errors.ServiceProvidersNotAvailable,
	);

	public static readonly OverlapsAcceptedBooking = new BusinessValidation(
		BookingBusinessValidations.errors.OverlapsAcceptedBooking,
	);

	public static readonly EndTimeLesserThanStartTime = new BusinessValidation(
		BookingBusinessValidations.errors.EndTimeLesserThanStartTime,
	);

	public static readonly CitizenUinFinNotFound = new BusinessValidation(
		BookingBusinessValidations.errors.CitizenUinFinNotFound,
	);

	public static readonly CitizenNameNotProvided = new BusinessValidation(
		BookingBusinessValidations.errors.CitizenNameNotProvided,
	);

	public static readonly CitizenEmailNotProvided = new BusinessValidation(
		BookingBusinessValidations.errors.CitizenEmailNotProvided,
	);

	public static readonly CitizenEmailNotValid = new BusinessValidation(
		BookingBusinessValidations.errors.CitizenEmailNotValid,
	);

	public static readonly ServiceProviderNotFound = (spId: number) =>
		new BusinessValidation(ErrorsRef(spId).booking.ServiceProviderNotFound);

	public static readonly OutOfSlotServiceProviderRequired = new BusinessValidation(
		BookingBusinessValidations.errors.OutOfSlotServiceProviderRequired,
	);

	public static readonly InvalidCaptchaToken = new BusinessValidation(
		BookingBusinessValidations.errors.InvalidCaptchaToken,
	);

	public static readonly OverlapsOnHoldBooking = new BusinessValidation(
		BookingBusinessValidations.errors.OverlapsOnHoldBooking,
	);

	public static readonly ServiceProviderLicenceExpire = new BusinessValidation(
		BookingBusinessValidations.errors.ServiceProviderLicenceExpire,
	);

	public static readonly VideoConferenceUrlIsInvalid = new BusinessValidation(
		BookingBusinessValidations.errors.VideoConferenceUrlIsInvalid,
	);

	public static readonly CitizenNameNotValid = new BusinessValidation(
		BookingBusinessValidations.errors.CitizenNameNotValid,
	);

	public static readonly CitizenSalutationNotProvided = new BusinessValidation(
		BookingBusinessValidations.errors.CitizenSalutationNotProvided,
	);

	public static readonly EventCapacityUnavailable = new BusinessValidation(
		BookingBusinessValidations.errors.EventCapacityUnavailable,
	);

	public static readonly PhoneNumberNotValid = new BusinessValidation(
		BookingBusinessValidations.errors.PhoneNumberNotValid,
	);
}
