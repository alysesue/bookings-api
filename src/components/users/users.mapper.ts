import { User } from '../../models';
import { AdminUserContract, ProfileResponse, SingPassUserContract, UserTypeContract } from './users.apicontract';

export class UsersMapper {
	public static mapToResponse(user: User): ProfileResponse {
		const instance = new ProfileResponse();
		if (user.isCitizen()) {
			instance.userType = UserTypeContract.singpass;
			instance.singpass = new SingPassUserContract();
			instance.singpass.uinfin = user.singPassUser.UinFin;
		} else if (user.isAdmin()) {
			instance.userType = UserTypeContract.admin;
			instance.admin = new AdminUserContract();
			instance.admin.email = user.adminUser.email;
		} else {
			throw new Error('User cannot be mapped to ProfileResponse. Id: ' + user.id);
		}

		return instance;
	}
}
