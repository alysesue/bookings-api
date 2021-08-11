import { UserContext, UserContextSnapshot } from '../userContext';
import { Organisation, User } from '../../../models';
import { AuthGroup } from '../authGroup';
import { MyInfoResponse } from '../../../models/myInfoTypes';

export class UserContextMock implements Partial<UserContext> {
	public static getCurrentUser = jest.fn<Promise<User>, any>();
	public static getAuthGroups = jest.fn<Promise<AuthGroup[]>, any>();
	public static getSnapshot = jest.fn<Promise<UserContextSnapshot>, any>();
	public static getFirstAuthorisedOrganisation = jest.fn<Promise<Organisation>, any>();
	public static getOtpAddOnMobileNo = jest.fn<string | undefined, any>();
	public static getMyInfo = jest.fn<Promise<MyInfoResponse | undefined>, any>();

	public init() {}

	public async getCurrentUser(...params): Promise<any> {
		return await UserContextMock.getCurrentUser(...params);
	}

	public async getAuthGroups(...params): Promise<any> {
		return await UserContextMock.getAuthGroups(...params);
	}

	public async getSnapshot(): Promise<UserContextSnapshot> {
		return await UserContextMock.getSnapshot();
	}

	public async verifyAndGetFirstAuthorisedOrganisation(...params): Promise<Organisation> {
		return await UserContextMock.getFirstAuthorisedOrganisation(...params);
	}

	public getOtpAddOnMobileNo(...params): string {
		return UserContextMock.getOtpAddOnMobileNo(...params);
	}

	public async getMyInfo(...params): Promise<MyInfoResponse | undefined> {
		return await UserContextMock.getMyInfo(...params);
	}
}
