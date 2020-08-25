import { Inject, InRequestScope } from "typescript-ioc";
import { UsersRepository } from "./users.repository";
import { User } from "../../models";

@InRequestScope
export class UsersService {
	@Inject
	private usersRepository: UsersRepository;

	public async save(user?: User): Promise<User> {
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
}
