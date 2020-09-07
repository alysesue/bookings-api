export const validateEmail = (email: string) => {
	// Regex validate format
	// anystring@anystring.anystring
	const emailReg = /\S+@\S+\.\S+/;
	return emailReg.test(email);
};
