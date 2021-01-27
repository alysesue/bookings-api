import { UsersService } from '../users.service';
import { User } from '../../../models';
import { AuthGroup } from '../../../infrastructure/auth/authGroup';

export class UsersServiceMock implements Partial<UsersService> {
	public static getOrSaveUserFromHeaders = jest.fn<Promise<User>, any>();
	public static getUserGroupsFromHeaders = jest.fn<Promise<AuthGroup[]>, any>();

	public async getOrSaveUserFromHeaders(...params): Promise<any> {
		return await UsersServiceMock.getOrSaveUserFromHeaders(...params);
	}

	public async getUserGroupsFromHeaders(...params): Promise<any> {
		return await UsersServiceMock.getUserGroupsFromHeaders(...params);
	}
}
