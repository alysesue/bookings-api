import { UsersService } from '../users.service';
import { User } from '../../../models';
import { AuthGroup } from '../../../infrastructure/auth/authGroup';

export class UsersServiceMock extends UsersService {
	public static getOrSaveUserFromHeaders = jest.fn<Promise<User>, any>();
	public static getUserGroupsFromHeaders = jest.fn<Promise<AuthGroup[]>, any>();
	public static upsertAdminUsers = jest.fn<Promise<User[]>, any>();

	public async getOrSaveUserFromHeaders(...params): Promise<any> {
		return await UsersServiceMock.getOrSaveUserFromHeaders(...params);
	}

	public async getUserGroupsFromHeaders(...params): Promise<any> {
		return await UsersServiceMock.getUserGroupsFromHeaders(...params);
	}

	public async upsertAdminUsers(...params): Promise<User[]> {
		return await UsersServiceMock.upsertAdminUsers(...params);
	}
}
