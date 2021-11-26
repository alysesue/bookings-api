export class UserProfileResponseV1 {
	public user: UserTypeResponse;
	public groups: AuthGroupResponseV1[];
	public otpAddon?: OtpAddOn;
}

export class UserProfileResponseV2 {
	public user: UserTypeResponse;
	public groups: AuthGroupResponseV2[];
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

export enum AuthGroupTypeContract {
	citizen = 'citizen',
	organisationAdmin = 'organisation-admin',
	serviceAdmin = 'service-admin',
	serviceProvider = 'service-provider',
	anonymous = 'anonymous',
	otp = 'otp',
}

export class AuthGroupResponseV1 {
	public authGroupType: AuthGroupTypeContract;
	public organisations?: OrganisationAdminGroupContractV1[];
	public services?: ServiceAdminGroupContractV1[];
	public serviceProvider?: ServiceProviderContractV1;
	public anonymous?: AnonymousGroupContract;
}

export class AuthGroupResponseV2 {
	public authGroupType: AuthGroupTypeContract;
	public organisations?: OrganisationAdminGroupContractV2[];
	public services?: ServiceAdminGroupContractV2[];
	public serviceProvider?: ServiceProviderContractV2;
	public anonymous?: AnonymousGroupContract;
}

export class OrganisationAdminGroupContractV1 {
	/**
	 * @isInt
	 */
	public id: number;
	public name: string;
}

export class OrganisationAdminGroupContractV2 {
	public id: string;
	public name: string;
}

export class ServiceAdminGroupContractV1 {
	/**
	 * @isInt
	 */
	public id: number;
	public name: string;
}

export class ServiceAdminGroupContractV2 {
	public id: string;
	public name: string;
}

export class ServiceProviderContractV1 {
	/**
	 * @isInt
	 */
	public id: number;
	public name: string;
}

export class ServiceProviderContractV2 {
	public id: string;
	public name: string;
}

export class AnonymousGroupContract {
	public bookingUUID?: string;
}
