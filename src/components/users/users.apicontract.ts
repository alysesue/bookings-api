export class UserProfileResponse {
	public user: UserTypeResponse;
	public groups: AuthGroupResponse[];
	public otpAddon?: OtpAddOn;
}

export class OtpAddOn {
	public mobileNo: string;
}

export class UserTypeResponse {
	public userType: UserTypeContract;
	/** This field is used when userType='singpass', for citizen users */
	public singpass?: SingPassUserContract;
	/** This field is used when userType='admin', for admin users */
	public admin?: AdminUserContract;
	/** This field is used when userType='agency', for agency users (system to system) */
	public agency?: AgencyUserContract;
}

export class SingPassUserContract {
	public uinfin: string;
}

export class AdminUserContract {
	public email: string;
	public agencyUserId: string;
	public name: string;
}

export class AgencyUserContract {
	public appId: string;
	public name: string;
}

export enum UserTypeContract {
	singpass = 'singpass',
	admin = 'admin',
	agency = 'agency',
	anonymous = 'anonymous',
}

export class AuthGroupResponse {
	public authGroupType: AuthGroupTypeContract;
	public organisations?: OrganisationAdminGroupContract[];
	public services?: ServiceAdminGroupContract[];
	public serviceProvider?: ServiceProviderContract;
	public anonymous?: AnonymousGroupContract;
}

export class OrganisationAdminGroupContract {
	/**
	 * @isInt
	 */
	public id: number;
	public name: string;
}

export class ServiceAdminGroupContract {
	/**
	 * @isInt
	 */
	public id: number;
	public name: string;
}

export class ServiceProviderContract {
	/**
	 * @isInt
	 */
	public id: number;
	public name: string;
}

export class AnonymousGroupContract {
	public bookingUUID?: string;
}

export enum AuthGroupTypeContract {
	citizen = 'citizen',
	organisationAdmin = 'organisation-admin',
	serviceAdmin = 'service-admin',
	serviceProvider = 'service-provider',
	anonymous = 'anonymous',
}
