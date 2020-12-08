export interface FailureResult {
	reason: { name: string; message: string };
}

export interface MolUpsertUsersFailureResult extends FailureResult, IMolCognitoUser {}

export type MolGetUserInfoOptions = Pick<IMolCognitoUser, 'uinfin' | 'agencyUserId' | 'email'>;

export interface MolGetUsersResponse {
	user?: IMolCognitoUser;
	message?: string;
}

export class MolAdminUser implements IMolCognitoUser {
	public sub?: string; // cognito id
	public username?: string;
	public name: string;
	public email: string;
	public phoneNumber: string;
	public agencyUserId?: string;
	public uinfin?: string;
	public groups?: string[];
	public services: string[];
}

export type MolAdminUserContract = Pick<
	MolAdminUser,
	// tslint:disable-next-line:max-union-size
	'name' | 'email' | 'phoneNumber' | 'agencyUserId' | 'uinfin' | 'services'
>;

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
	created?: IMolCognitoUser[];

	/**
	 * Updated accounts
	 */
	updated?: IMolCognitoUser[];

	/**
	 * Accounts that have failed to be created
	 */
	failed?: MolUpsertUsersFailureResult[];
}

export interface IMolCognitoUser {
	sub?: string; // cognito id
	username?: string;
	name: string;
	email: string;
	phoneNumber: string;
	agencyUserId?: string;
	uinfin?: string;
	groups?: string[];
}
