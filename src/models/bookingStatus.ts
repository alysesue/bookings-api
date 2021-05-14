export enum BookingStatus {
	PendingApproval = 1,
	Accepted = 2,
	Cancelled = 3,
	Rejected = 4,
	OnHold = 5,
}

export const bookingStatusArray = [
	BookingStatus.PendingApproval,
	BookingStatus.Accepted,
	BookingStatus.Cancelled,
	BookingStatus.Rejected,
];

export enum BookingStatusDisplayedInEmails {
	'Pending Approval' = 1,
	Accepted = 2,
	Cancelled = 3,
	Rejected = 4,
	'On Hold' = 5,
}
