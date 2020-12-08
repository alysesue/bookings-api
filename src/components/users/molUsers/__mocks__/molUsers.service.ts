import { MolUsersService } from '../molUsers.service';
import { IMolCognitoUser, MolUpsertUsersResult } from '../molUsers.apicontract';

export class MolUsersServiceMock extends MolUsersService {
	public static molUpsertUser = jest.fn();

	public async molUpsertUser(users: IMolCognitoUser[]): Promise<MolUpsertUsersResult> {
		return await MolUsersServiceMock.molUpsertUser(users);
	}
}
