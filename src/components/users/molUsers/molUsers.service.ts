import { InRequestScope } from 'typescript-ioc';
import { v4 as uuidv4 } from 'uuid';
import {
	IMolCognitoUser,
	MolGetUserInfoOptions,
	MolGetUsersResponse,
	MolUpsertUsersResult,
} from './molUsers.apicontract';
import { get, post } from '../../../tools/fetch';
import { getConfig } from '../../../config/app-config';

@InRequestScope
export class MolUsersService {
	private config = getConfig();

	// TODO: Change when we can get it from the header
	private TOKEN =
		'eyJ2ZXJzaW9uIjoiMCIsImVuYyI6IkEyNTZHQ00iLCJhbGciOiJkaXIiLCJraWQiOiI4ZmRnSmhKLTluTGVxalZTa2FzaU82dTNNQzhldkhXV1RzVnEzYzlxTlhNIn0..PnAHz57kiFUNf1NU.cywvBGJMvKwYgNuLZzLvN2uOz0iIb_YJtManMpcjipwACGapnXFVCJxXV05_0lzKqXCVVd5aXulRPsj7yoRV3J68AF2BsruBhPQQ4HYAaibBkD7EdMgLAXk0L6b3TBK1ICuE1UxWqQNuoayieUPaAuzji5Kx3_5Noysd6ZuSgXURggz0Stuti78PLayGq2FQ_z2sXTyAx3bmKQQhg-yYZQ.2axppa448BI00f17W0VZAA';

	public async molUpsertUser(users: IMolCognitoUser[]): Promise<MolUpsertUsersResult> {
		if (this.config.isLocal) return this.molUpsertUserLocal(users);
		else return this.molUpsertUserEnv(users);
	}

	private async molUpsertUserEnv(users: IMolCognitoUser[]): Promise<MolUpsertUsersResult> {
		const URL_MOL_USER = this.config.molAdminAuthForwarder.url;
		const headers = { authorization: this.TOKEN };
		const upsertRes = await post(URL_MOL_USER, users, headers);
		return upsertRes;
	}

	private async molUpsertUserLocal(users: IMolCognitoUser[]): Promise<MolUpsertUsersResult> {
		users.forEach((user) => (user.sub = uuidv4()));

		return Promise.resolve({ created: users });
	}

	public async molGetUser(molGetUserInfoOptions: MolGetUserInfoOptions): Promise<MolGetUsersResponse> {
		if (this.config.isLocal) return this.molGetUserLocal(molGetUserInfoOptions);
		else return this.molGetUserEnv(molGetUserInfoOptions);
	}

	private async molGetUserEnv(molGetUserInfoOptions: MolGetUserInfoOptions): Promise<MolGetUsersResponse> {
		const URL_MOL_USER = this.config.molAdminAuthForwarder.url;
		const headers = { authorization: this.TOKEN };
		const upsertRes = await get(URL_MOL_USER, molGetUserInfoOptions, headers);
		return upsertRes;
	}

	private async molGetUserLocal(molGetUserInfoOptions: MolGetUserInfoOptions): Promise<MolGetUsersResponse> {
		return Promise.resolve({
			user: {
				...molGetUserInfoOptions,
				username: 'mockUsername',
				name: 'mockName',
				phoneNumber: 'MockPhoneNumber',
			},
		});
	}
}
