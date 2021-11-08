export const ErrorsRef = (arg1?: string | number) => ({
	/** Reserved BookingBusinessValidations range: 10001 - 10099 */
	booking: {
		ServiceProviderNotAvailable: {
			code: '10001',
			message: `The service provider is not available in the selected time range`,
		},
		ServiceProvidersNotAvailable: {
			code: '10002',
			message: `No available service providers in the selected time range`,
		},
		OverlapsAcceptedBooking: {
			code: '10003',
			message: `Booking request not valid as it overlaps another accepted booking`,
		},
		EndTimeLesserThanStartTime: {
			code: '10004',
			message: `End time for booking must be greater than start time`,
		},
		CitizenUinFinNotFound: {
			code: '10005',
			message: `Citizen UIN/FIN not found`,
		},
		CitizenNameNotProvided: {
			code: '10006',
			message: `Citizen name not provided`,
		},
		CitizenEmailNotProvided: {
			code: '10007',
			message: `Citizen email not provided`,
		},
		CitizenEmailNotValid: {
			code: '10008',
			message: `Citizen email not valid`,
		},
		ServiceProviderNotFound: {
			code: '10009',
			message: `Service provider '${arg1}' not found`,
		},
		OutOfSlotServiceProviderRequired: {
			code: '10010',
			message: `Service provider is required for out of slot bookings`,
		},
		InvalidCaptchaToken: {
			code: '10011',
			message: `Invalid captcha token`,
		},
		OverlapsOnHoldBooking: {
			code: '10012',
			message: `Booking request not valid as it overlaps another on hold booking`,
		},
		ServiceProviderLicenceExpire: {
			code: '10013',
			message: `Licence of service provider will be expired`,
		},
		VideoConferenceUrlIsInvalid: {
			code: '10014',
			message: `Invalid video conference link is provided`,
		},
		CitizenNameNotValid: {
			code: '10015',
			message: `Citizen name is not valid`,
		},
		PhoneNumberNotValid: {
			code: '10016',
			message: `Citizen phone number not valid`,
		},
		EventCapacityUnavailable: {
			code: '10017',
			message: `Event is out of capacity`,
		},
		CitizenSalutationNotProvided: {
			code: '10018',
			message: 'Citizen salutation not provided',
		},
	},
	// Business validation range: 10101-10199
	oneOffTimeslot: {
		titleTooLong: {
			code: '10101',
			message: `Title word limit is 100 characters`,
		},
		invalidTime: {
			code: '10102',
			message: `Start time must be less than end time`,
		},
		descriptionTooLong: {
			code: '10103',
			message: `Description word limit is 4000 characters`,
		},
		sameService: {
			code: '10104',
			message: `Service providers should be part of the same service`,
		},
		atLeastOneSlot: {
			code: '10105',
			message: `Event should have at least one slot`,
		},
	},
	// Business validation range: 10201-10299
	dynamicValue: {
		IncorrectFieldValueType: {
			code: '10201',
			templateMessage: ({ name }) => `Value type mismatch for ${name} field.`,
		},
		FieldValueIsRequired: {
			code: '10202',
			templateMessage: ({ name }) => `${name} field is required.`,
		},
		TextFieldLimit: {
			code: '10250',
			templateMessage: ({ name, charLimit }) => `${name} word limit is ${charLimit} characters.`,
		},
		DateOnlyInvalid: {
			code: '10260',
			templateMessage: ({ name }) => `${name} value is not a valid date.`,
		},
	},
	// Business validation range: 10301-10399
	service: {
		ServiceWithoutName: {
			code: '10300',
			message: `Service name is empty`,
		},
		VideoConferenceInvalidUrl: {
			code: '10301',
			message: `Invalid URL`,
		},
		VideoConferenceInvalidUrlLength: {
			code: '10302',
			message: `Invalid URL length`,
		},
		InvalidMaxMinDaysInAdvance: {
			code: '10303',
			message: `'Max days in advance' value must be greater than 'min days in advance' value when present.`,
		},
		InvalidMinDaysInAdvance: {
			code: '10304',
			message: `Invalid 'min days in advance' value.`,
		},
		InvalidMaxDaysInAdvance: {
			code: '10305',
			message: `Invalid 'max days in advance' value.`,
		},
	},
});
