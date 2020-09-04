import { InRequestScope } from 'typescript-ioc';
import { RepositoryBase } from '../../core/repository';
import { User } from '../../models';

@InRequestScope
export class UsersRepository extends RepositoryBase<User> {
	constructor() {
		super(User);
	}
	public async save(user: User): Promise<User> {
		return await (await this.getRepository()).save(user);
	}

	public async getUserByMolUserId(molUserId?: string): Promise<User> {
		if (!molUserId) return null;

		const repository = await this.getRepository();
		const query = repository
			.createQueryBuilder('u')
			.innerJoinAndSelect('u._singPassUser', 'singpass', 'singpass."_molUserId" = :molUserId', { molUserId });

		return await query.getOne();
	}

	public async getUserByMolAdminId(molAdminId?: string): Promise<User> {
		if (!molAdminId) return null;

		const repository = await this.getRepository();
		const query = repository
			.createQueryBuilder('u')
			.innerJoinAndSelect('u._adminUser', 'admuser', 'admuser."_molAdminId" = :molAdminId', { molAdminId });

		return await query.getOne();
	}
}
