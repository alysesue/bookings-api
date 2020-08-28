import { Inject, InRequestScope } from "typescript-ioc";
import { UsersRepository } from "./users.repository";
import { User } from "../../models";
import { MOLAuthType } from "mol-lib-api-contract/auth/common/MOLAuthType";
import { MOLSecurityHeaderKeys } from "mol-lib-api-contract/auth/common/mol-security-headers";

type headersType = { [key: string]: string };

@InRequestScope
export class UsersService {
	@Inject
	private usersRepository: UsersRepository;

	public async getUserOrSave(user?: User): Promise<User> {
		if (!user)
			return undefined;
		let userRepo = await this.usersRepository.getUserByMolUserId(user.singPassUser.molUserId);
		if (!userRepo) {
			try {
				userRepo = await this.usersRepository.save(user);
			} catch {
				// concurrency insert fail case
				userRepo = await this.usersRepository.getUserByMolUserId(user.singPassUser.molUserId);
			}
		}
		return userRepo;
	}


	private async getOrSaveInternal(user: User, getter: () => Promise<User>): Promise<User> {
		let userRepo = await getter();
		if (!userRepo) {
			try {
				userRepo = await this.usersRepository.save(user);
			} catch {
				// concurrent insert fail case
				userRepo = await getter();
			}
		}
		return userRepo;
	}

	public async getOrSaveUserFromHeaders(headers: headersType): Promise<User> {
		const authType = headers[MOLSecurityHeaderKeys.AUTH_TYPE];
		switch (authType) {
			case MOLAuthType.USER:
				return await this.getOrSaveSingpassUser({
					molUserId: headers[MOLSecurityHeaderKeys.USER_ID],
					molUserUinFin: headers[MOLSecurityHeaderKeys.USER_UINFIN],
				});
			case MOLAuthType.ADMIN:
				return await this.getOrSaveAdminUser({
					molAdminId: headers[MOLSecurityHeaderKeys.ADMIN_ID],
					molAdminUserName: headers[MOLSecurityHeaderKeys.ADMIN_USERNAME],
					molAdminEmail: headers[MOLSecurityHeaderKeys.ADMIN_EMAIL],
					molAdminName: headers[MOLSecurityHeaderKeys.ADMIN_NAME],
				});
		}

		return null;
	}

	public async getOrSaveSingpassUser({ molUserId, molUserUinFin }:
		{
			molUserId: string, molUserUinFin: string
		}): Promise<User> {
		const user = User.createSingPassUser(molUserId, molUserUinFin);
		return await this.getOrSaveInternal(user, () => this.usersRepository.getUserByMolUserId(molUserId));
	}

	public async getOrSaveAdminUser(props: {
		molAdminId: string, molAdminUserName: string, molAdminEmail: string, molAdminName: string
	}): Promise<User> {
		throw new Error('Not supported yet.');
	}
}
