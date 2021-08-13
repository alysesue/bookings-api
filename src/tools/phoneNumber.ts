import { PhoneNumber, PhoneNumberUtil } from 'google-libphonenumber';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const getNationalPhoneNumberAndCountryCode = (
	bookingNumber?: string,
): { parsedPhoneNumber?: string; parsedCountryCode?: string } => {
	if (!bookingNumber) {
		return { parsedPhoneNumber: '', parsedCountryCode: '' };
	}
	const newPhoneNumber = getPhoneNumber(bookingNumber);
	if (newPhoneNumber) {
		return {
			parsedPhoneNumber: newPhoneNumber.getNationalNumber()?.toString(),
			parsedCountryCode: newPhoneNumber.getCountryCode()?.toString(),
		};
	} else {
		return { parsedPhoneNumber: '', parsedCountryCode: '' };
	}
};

export const getPhoneNumber = (inputNumber: string): PhoneNumber | undefined => {
	const phoneUtil = PhoneNumberUtil.getInstance();
	try {
		return phoneUtil.parse(inputNumber);
	} catch (e) {
		try {
			return phoneUtil.parse(inputNumber, 'SG');
		} catch (e) {
			return undefined;
		}
	}
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const isVerifiedPhoneNumber = (bookingNumber: string): boolean => {
	const phoneUtil = PhoneNumberUtil.getInstance();
	const phoneNumber = getPhoneNumber(bookingNumber);
	if (!phoneNumber) {
		return false;
	} else {
		const isPossibleNumber = phoneUtil.isPossibleNumber(phoneNumber);
		const isValidNumber = phoneUtil.isValidNumber(phoneNumber);
		if (!isPossibleNumber || !isValidNumber) {
			return false;
		} else {
			return true;
		}
	}
};
