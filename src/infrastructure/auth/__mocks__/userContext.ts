import { UserContext } from '../userContext';
import { Organisation, User } from '../../../models';
import { AuthGroup } from '../authGroup';

export class UserContextMock implements Partial<UserContext> {
	public static getCurrentUser = jest.fn<Promise<User>, any>();
	public static getAuthGroups = jest.fn<Promise<AuthGroup[]>, any>();
	public static getFirstAuthorisedOrganisation = jest.fn<Promise<Organisation>, any>();

	public init() {}

	public async getCurrentUser(...params): Promise<any> {
		return await UserContextMock.getCurrentUser(...params);
	}

	public async getAuthGroups(...params): Promise<any> {
		return await UserContextMock.getAuthGroups(...params);
	}

	public async verifyAndGetFirstAuthorisedOrganisation(...params): Promise<Organisation> {
		return await UserContextMock.getFirstAuthorisedOrganisation(...params);
	}
}
