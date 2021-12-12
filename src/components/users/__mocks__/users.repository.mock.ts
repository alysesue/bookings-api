import { User } from '../../../models';
import { UsersRepository } from '../users.repository';

export class UserRepositoryMock implements Partial<UsersRepository> {
	public static save = jest.fn();
	public static getUserByMobileNo = jest.fn();
	public static getUserByTrackingId = jest.fn();
	public static getUserByMolUserId = jest.fn();
	public static getUserByUinFin = jest.fn();
	public static getUserByMolAdminId = jest.fn();
	public static getUsersByMolAdminIds = jest.fn();
	public static getUserByAgencyAppId = jest.fn();

	public async save(...params): Promise<any> {
		return await UserRepositoryMock.save(...params);
	}

	public async getUserByMobileNo(...params): Promise<User> {
		return await UserRepositoryMock.getUserByMobileNo(...params);
	}

	public async getUserByTrackingId(...params): Promise<User> {
		return await UserRepositoryMock.getUserByTrackingId(...params);
	}

	public async getUserByMolUserId(...params): Promise<User> {
		return await UserRepositoryMock.getUserByMolUserId(...params);
	}

	public async getUserByUinFin(...params): Promise<User> {
		return await UserRepositoryMock.getUserByUinFin(...params);
	}

	public async getUserByMolAdminId(...params): Promise<User> {
		return await UserRepositoryMock.getUserByMolAdminId(...params);
	}

	public async getUsersByMolAdminIds(...params): Promise<User[]> {
		return await UserRepositoryMock.getUsersByMolAdminIds(...params);
	}

	public async getUserByAgencyAppId(...params): Promise<User> {
		return await UserRepositoryMock.getUserByAgencyAppId(...params);
	}
}
