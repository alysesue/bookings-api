export enum MyInfoFieldType {
	// name = 'name',
	// uinfin = 'uinfin',
	// mobileno = 'mobileno',
	// email = 'email',
	// *** Fields above are not dynamic yet

	nationality = 'nationality',
	dob = 'dob',
	sex = 'sex',
	regadd_postal = 'regadd_postal',
	residentialstatus = 'residentialstatus',
}

export const DEFAULT_MYINFO_NAMES = {
	// [MyInfoFieldType.name]: 'Name',
	// [MyInfoFieldType.uinfin]: 'NRIC',
	// [MyInfoFieldType.mobileno]: 'Phone number',
	// [MyInfoFieldType.email]: 'Email',
	// *** Fields above are not dynamic yet

	[MyInfoFieldType.nationality]: 'Nationality',
	[MyInfoFieldType.dob]: 'Date of birth',
	[MyInfoFieldType.sex]: 'Sex',
	[MyInfoFieldType.regadd_postal]: 'Postal code',
	[MyInfoFieldType.residentialstatus]: 'Residential status',
};
