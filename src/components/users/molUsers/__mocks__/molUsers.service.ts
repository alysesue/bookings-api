import { MolUsersService } from '../molUsers.service';
import { IMolCognitoUserRequest, MolUpsertUsersResult } from '../molUsers.apicontract';

export class MolUsersServiceMock extends MolUsersService {
	public static molUpsertUser = jest.fn();

	public async molUpsertUser(users: IMolCognitoUserRequest[]): Promise<MolUpsertUsersResult> {
		return await MolUsersServiceMock.molUpsertUser(users);
	}
}
