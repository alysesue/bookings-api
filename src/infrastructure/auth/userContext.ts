import { OtpService } from './../../components/otp/otp.service';
import { Inject, InRequestScope } from 'typescript-ioc';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { Organisation, User } from '../../models';
import { UsersService } from '../../components/users/users.service';
import { AsyncLazy } from '../../tools/asyncLazy';
import { AnonymousCookieData, MobileOtpAddOnCookieData } from '../bookingSGCookieHelper';
import { AuthGroup, CitizenAuthGroup, OrganisationAdminAuthGroup } from './authGroup';
import { ContainerContext } from '../containerContext';
import { MyInfoService } from '../../components/myInfo/myInfo.service';
import { MyInfoResponse } from '../../models/myInfoTypes';

export type UserContextSnapshot = {
	user: User;
	otpAddon?: {
		mobileNo: string;
	};
	authGroups: AuthGroup[];
};

@InRequestScope
export class UserContext {
	@Inject
	private containerContext: ContainerContext;
	private _requestHeaders: any;
	private _anonymousCookieData: AnonymousCookieData;
	private _currentUser: AsyncLazy<User>;
	private _authGroups: AsyncLazy<AuthGroup[]>;
	private _myInfo: AsyncLazy<MyInfoResponse | undefined>;
	private _mobileNo: string;

	constructor() {
		this.init({ requestHeaders: {} });
	}

	private resetAsyncLazy(): void {
		this._currentUser = new AsyncLazy(this.getCurrentUserInternal.bind(this));
		this._authGroups = new AsyncLazy(this.getAuthGroupsInternal.bind(this));
		this._myInfo = new AsyncLazy(this.getMyInfoInternal.bind(this));
	}

	public init({ requestHeaders }: { requestHeaders: any }) {
		this._requestHeaders = requestHeaders || {};
		this.resetAsyncLazy();
	}

	public setAnonymousUser(anonymousCookieData: AnonymousCookieData): void {
		if (!anonymousCookieData) return;

		this._anonymousCookieData = anonymousCookieData;
		this.resetAsyncLazy();
	}

	public async getCurrentUser(): Promise<User> {
		return await this._currentUser.getValue();
	}

	public async getAuthGroups(): Promise<AuthGroup[]> {
		return await this._authGroups.getValue();
	}

	public async getMyInfo(): Promise<MyInfoResponse> {
		return await this._myInfo.getValue();
	}

	public async getSnapshot(): Promise<UserContextSnapshot> {
		return {
			user: await this.getCurrentUser(),
			authGroups: await this.getAuthGroups(),
			otpAddon: this._mobileNo
				? {
						mobileNo: this._mobileNo,
				  }
				: undefined,
		};
	}

	public async otpAddOn(cookieData: MobileOtpAddOnCookieData): Promise<void> {
		if (!cookieData) {
			return;
		}
		const otp = this.containerContext.resolve(OtpService);
		this._mobileNo = await otp.getMobileNo(cookieData.otpReqId);
	}

	public getOtpAddOnMobileNo(): string | undefined {
		return this._mobileNo;
	}

	private async getCurrentUserInternal(): Promise<User> {
		const usersService = this.containerContext.resolve(UsersService);
		if (this._anonymousCookieData) {
			return await usersService.createAnonymousUserFromCookie(this._anonymousCookieData);
		} else {
			return await usersService.getOrSaveUserFromHeaders(this._requestHeaders);
		}
	}

	private async getAuthGroupsInternal(): Promise<AuthGroup[]> {
		const user = await this.getCurrentUser();
		if (!user) {
			return [];
		}

		if (user.isAnonymous()) {
			const otpInfo = this._mobileNo ? { mobileNo: this._mobileNo } : undefined;
			const usersService = this.containerContext.resolve(UsersService);
			return await usersService.getAnonymousUserRoles(user, otpInfo);
		} else if (user.isCitizen()) {
			return [new CitizenAuthGroup(user)];
		} else {
			const usersService = this.containerContext.resolve(UsersService);
			return await usersService.getUserGroupsFromHeaders(user, this._requestHeaders);
		}
	}

	private async getMyInfoInternal(): Promise<MyInfoResponse | undefined> {
		const myInfoService = this.containerContext.resolve(MyInfoService);
		const user = await this.getCurrentUser();
		if (!user) {
			return undefined;
		}
		return myInfoService.getMyInfo(user);
	}

	public async verifyAndGetFirstAuthorisedOrganisation(errorMessage?: string): Promise<Organisation> {
		const orgAdmins = (await this._authGroups.getValue()).filter(
			(g) => g instanceof OrganisationAdminAuthGroup,
		) as OrganisationAdminAuthGroup[];
		if (orgAdmins.length === 0) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_AUTHORIZATION).setMessage(errorMessage);
		} else {
			return orgAdmins[0].authorisedOrganisations[0];
		}
	}
}
