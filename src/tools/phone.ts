export const validatePhoneNumber = (phone: string) => {
	// Regex validate format
	// +XX-XXXX-XXXX
	// +XX.XXXX.XXXX
	// +XX XXXX XXXX
	const phoneReg = /^\+?([0-9]{2})\)?[-. ]?([0-9]{4})[-. ]?([0-9]{4})$/;
	return phoneReg.test(phone);
};