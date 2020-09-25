export class UserProfileResponse {
	public user: UserTypeResponse;
	public groups: AuthGroupResponse[];
}

export class UserTypeResponse {
	public userType: UserTypeContract;
	public singpass?: SingPassUserContract;
	public admin?: AdminUserContract;
}

export class SingPassUserContract {
	public uinfin: string;
}

export class AdminUserContract {
	public email: string;
}

export enum UserTypeContract {
	singpass = 'singpass',
	admin = 'admin',
}

export class AuthGroupResponse {
	public authGroupType: AuthGroupTypeContract;
	public organisations?: OrganisationAdminGroupContract[];
	public services?: ServiceAdminGroupContract[];
	public serviceProvider?: ServiceProviderContract;
}

export class OrganisationAdminGroupContract {
	public name: string;
}

export class ServiceAdminGroupContract {
	public id: number;
	public name: string;
}

export class ServiceProviderContract {
	public id: number;
	public name: string;
}

export enum AuthGroupTypeContract {
	citizen = 'citizen',
	organisationAdmin = 'organisation-admin',
	serviceAdmin = 'service-admin',
	serviceProvider = 'service-provider',
}
