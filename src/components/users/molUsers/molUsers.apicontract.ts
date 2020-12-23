export interface FailureResult {
	reason: { name: string; message: string };
}

export interface MolUpsertUsersFailureResult extends FailureResult, IMolCognitoUserRequest {}

export type MolGetUserInfoOptions = Pick<IMolCognitoUserRequest, 'uinfin' | 'agencyUserId' | 'email'>;

export interface MolGetUsersResponse {
	user?: IMolCognitoUserRequest;
	message?: string;
}

export type MolServiceAdminUserCSV = {
	name: string;
	email: string;
	phoneNumber: string;
	agencyUserId?: string;
	uinfin?: string;
	serviceNames: string; // elements split by ; symbol
};

export type MolServiceAdminUserContract = {
	name: string;
	email: string;
	phoneNumber: string;
	agencyUserId?: string;
	uinfin?: string;
	serviceNames: string[];
};

export type MolServiceAdminUserWithGroups = MolServiceAdminUserContract & {
	groups: string[];
};

export interface MolUpsertUsersResult {
	/**
	 * Error if there is any
	 */
	error?: string;

	/**
	 * Csv output with user id appended at the end of each row
	 */
	csv?: string;

	/**
	 * Newly created accounts
	 */
	created?: IMolCognitoUserResponse[];

	/**
	 * Updated accounts
	 */
	updated?: IMolCognitoUserResponse[];

	/**
	 * Accounts that have failed to be created
	 */
	failed?: MolUpsertUsersFailureResult[];
}

export interface IMolCognitoUserRequest {
	name: string;
	email?: string;
	phoneNumber: string;
	agencyUserId?: string;
	uinfin?: string;
	groups?: string[];
}

export interface IMolCognitoUserResponse {
	sub: string; // cognito id
	username: string;
	name: string;
	email?: string;
	phoneNumber: string;
	agencyUserId?: string;
	uinfin?: string;
	groups: string[];
}

export function isMolUserMatch(
	molUser: IMolCognitoUserResponse,
	match: { agencyUserId?: string; uinfin?: string; email?: string },
): boolean {
	return (
		(molUser.uinfin?.toLowerCase() || '') === (match.uinfin?.toLowerCase() || '') &&
		(molUser.agencyUserId?.toLowerCase() || '') === (match.agencyUserId?.toLowerCase() || '') &&
		(molUser.email?.toLowerCase() || '') === (match.email?.toLowerCase() || '')
	);
}
