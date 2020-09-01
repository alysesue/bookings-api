export class ProfileResponse {
	public userType: UserTypeContract;
	public singpass: SingPassUserContract;
	public admin: AdminUserContract;
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
