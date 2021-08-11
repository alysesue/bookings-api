export type MyInfoStringValue = {
	value: string;
};

export type MyInfoResponse = {
	data: {
		name: MyInfoStringValue;
		mobileno: { nbr: MyInfoStringValue };
		email: MyInfoStringValue;
	};
};
