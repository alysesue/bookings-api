import { UsersService } from '../users.service';
import { User } from '../../../models';
import { AuthGroup } from '../../../infrastructure/auth/authGroup';

export class UsersServiceMock implements Partial<UsersService> {
	public static getOrSaveUserFromHeaders = jest.fn<Promise<User>, any>();
	public static getUserGroupsFromHeaders = jest.fn<Promise<AuthGroup[]>, any>();
	public static createAnonymousUserFromCookie = jest.fn<Promise<User>, any>();
	public static getAnonymousUserRoles = jest.fn<Promise<AuthGroup[]>, any>();
	public static getOtpUser = jest.fn<Promise<User>, any>();
	public static createOtpUser = jest.fn<Promise<User>, any>();

	public async getOrSaveUserFromHeaders(...params): Promise<any> {
		return await UsersServiceMock.getOrSaveUserFromHeaders(...params);
	}

	public async getUserGroupsFromHeaders(...params): Promise<any> {
		return await UsersServiceMock.getUserGroupsFromHeaders(...params);
	}

	public async createAnonymousUserFromCookie(...params): Promise<User> {
		return await UsersServiceMock.createAnonymousUserFromCookie(...params);
	}

	public async getAnonymousUserRoles(...params): Promise<AuthGroup[]> {
		return await UsersServiceMock.getAnonymousUserRoles(...params);
	}

	public async getOtpUser(...params): Promise<User> {
		return await UsersServiceMock.getOtpUser(...params);
	}

	public async createOtpUser(...params): Promise<User> {
		return await UsersServiceMock.createOtpUser(...params);
	}
}
