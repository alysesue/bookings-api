import { Inject, InRequestScope } from 'typescript-ioc';
import { v4 as uuidv4 } from 'uuid';
import { IMolCognitoUserRequest, MolUpsertUsersResult } from './molUsers.apicontract';
import { post } from '../../../tools/fetch';
import { getConfig } from '../../../config/app-config';

export abstract class MolUsersService {
	public abstract molUpsertUser(users: IMolCognitoUserRequest[]): Promise<MolUpsertUsersResult>;
}

@InRequestScope
export class MolUsersServiceAuthForwarder extends MolUsersService {
	public async molUpsertUser(users: IMolCognitoUserRequest[]): Promise<MolUpsertUsersResult> {
		const config = getConfig();
		const URL_MOL_USER = `${config.molAdminAuthForwarder.url}/api/users/v1`;
		const upsertRes = await post(URL_MOL_USER, { users });
		return upsertRes;
	}
}

@InRequestScope
export class MolUsersServiceLocal extends MolUsersService {
	public async molUpsertUser(users: IMolCognitoUserRequest[]): Promise<MolUpsertUsersResult> {
		const created = users.map((user) => {
			const username = user.uinfin ?? user.agencyUserId ?? user.email;
			if (!username) {
				throw new Error('MolUsersServiceLocal: User name undefined');
			}
			return {
				...user,
				sub: uuidv4(),
				username,
				groups: user.groups || [],
			};
		});

		return Promise.resolve({ created });
	}
}

@InRequestScope
export class MolUsersServiceFactory {
	@Inject
	private _authForwarderService: MolUsersServiceAuthForwarder;
	@Inject
	private _localService: MolUsersServiceLocal;

	public getService(): MolUsersService {
		return getConfig().isLocal ? this._localService : this._authForwarderService;
	}
}