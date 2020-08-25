import { InRequestScope } from "typescript-ioc";
import { RepositoryBase } from "../../core/repository";
import { User } from "../../models";

@InRequestScope
export class UsersRepository extends RepositoryBase<User> {
	constructor() {
		super(User);
	}
	public async getUserMolUserId(molUserId: string): Promise<User> {
		const repository = await this.getRepository();

		const molUserIdCondition = 'exists(select * from public.sing_pass_user as sg where sg."_userId" = u._id AND sg."_molUserId" = :molUserId)';
		const query = repository.createQueryBuilder("u")
			.where(molUserIdCondition, {molUserId})
			.leftJoinAndSelect("u._singPassUser", "singPass");

		return await query.getOne();
	}
}