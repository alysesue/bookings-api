import { User } from "../../models";
import { Citizen, UserRequest } from "./users.apicontract";



export class UsersFactory {
	public static createUser(userRequest: UserRequest) {
		if(Citizen.isCitizen(userRequest)) {
			const citizen = userRequest as Citizen;
			return User.createSingPassUser(citizen.userMolId, citizen.userUinFin);
		}
		else
			return null;
	}
}