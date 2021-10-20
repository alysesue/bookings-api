export enum BookingStatus {
	PendingApproval = 1,
	Accepted = 2,
	Cancelled = 3,
	Rejected = 4,
	OnHold = 5,
	PendingApprovalSA = 6,
}

export enum BookingStatusDisplayedInEmails {
	'Pending Approval' = 1,
	Accepted = 2,
	Cancelled = 3,
	Rejected = 4,
	'On Hold' = 5,
	'Pending SA Verification' = 6,
}
