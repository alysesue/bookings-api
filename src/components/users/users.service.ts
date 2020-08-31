import { Inject, InRequestScope } from "typescript-ioc";
import { UsersRepository } from "./users.repository";
import { User } from "../../models";
import { MOLAuthType } from "mol-lib-api-contract/auth/common/MOLAuthType";
import { MOLSecurityHeaderKeys } from "mol-lib-api-contract/auth/common/mol-security-headers";
import { ErrorCodeV2, MOLErrorV2 } from "mol-lib-api-contract";
import { logger } from "mol-lib-common/debugging/logging/LoggerV2";
export type HeadersType = { [key: string]: string };

@InRequestScope
export class UsersService {
	@Inject
	private usersRepository: UsersRepository;

	// public async getUserOrSave(user?: User): Promise<User> {
	// 	if (!user)
	// 		return undefined;
	// 	let userRepo = await this.usersRepository.getUserByMolUserId(user.singPassUser.molUserId);
	// 	if (!userRepo) {
	// 		try {
	// 			userRepo = await this.usersRepository.save(user);
	// 		} catch {
	// 			// concurrency insert fail case
	// 			userRepo = await this.usersRepository.getUserByMolUserId(user.singPassUser.molUserId);
	// 		}
	// 	}
	// 	return userRepo;
	// }


	private async getOrSaveInternal(user: User, getter: () => Promise<User>): Promise<User> {
		let userRepo = await getter();
		if (!userRepo) {
			try {
				userRepo = await this.usersRepository.save(user);
			} catch (e) {
				logger.error("Exception when creating BookingSG User", e);
				// concurrent insert fail case
				userRepo = await getter();
			}
		}
		return userRepo;
	}

	public async getOrSaveUserFromHeaders(headers: HeadersType): Promise<User> {
		const authType = headers[MOLSecurityHeaderKeys.AUTH_TYPE];
		if (!authType) {
			return null;
		}

		let user: User;
		switch (authType) {
			case MOLAuthType.USER:
				user = await this.getOrSaveSingpassUser({
					molUserId: headers[MOLSecurityHeaderKeys.USER_ID],
					molUserUinFin: headers[MOLSecurityHeaderKeys.USER_UINFIN],
				});
				break;
			case MOLAuthType.ADMIN:
				user = await this.getOrSaveAdminUser({
					molAdminId: headers[MOLSecurityHeaderKeys.ADMIN_ID],
					userName: headers[MOLSecurityHeaderKeys.ADMIN_USERNAME],
					email: headers[MOLSecurityHeaderKeys.ADMIN_EMAIL],
					name: headers[MOLSecurityHeaderKeys.ADMIN_NAME],
				});
				break;
		}

		if (!user) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_AUTHENTICATION).setMessage('BookingSG User could not be created. authType: ' + authType);
		}

		return user;
	}

	public async getOrSaveSingpassUser({ molUserId, molUserUinFin }:
		{
			molUserId: string, molUserUinFin: string
		}): Promise<User> {
		if (!molUserId || !molUserUinFin)
			return null;

		const user = User.createSingPassUser(molUserId, molUserUinFin);
		return await this.getOrSaveInternal(user, () => this.usersRepository.getUserByMolUserId(molUserId));
	}

	public async getOrSaveAdminUser(data: {
		molAdminId: string;
		userName: string;
		email: string;
		name: string;
	}): Promise<User> {
		if (!data.molAdminId || !data.email) {
			return null;
		}

		const user = User.createAdminUser(data);
		return await this.getOrSaveInternal(user, () => this.usersRepository.getUserByMolAdminId(data.molAdminId));
	}
}
