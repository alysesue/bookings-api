import { InRequestScope } from 'typescript-ioc';
import { RepositoryBase } from '../../core/repository';
import { User } from '../../models';

@InRequestScope
export class UsersRepository extends RepositoryBase<User> {
	constructor() {
		super(User);
	}
	public async save(user: User): Promise<User> {
		const repository = await this.getRepository();
		return await repository.save(user);
	}

	public async getUserByMobileNo(mobileNo?: string): Promise<User> {
		if (!mobileNo) return null;

		const repository = await this.getRepository();
		const query = repository
			.createQueryBuilder('u')
			.innerJoinAndSelect('u._otpUser', 'otp', 'otp."_mobileNo" = :mobileNo', {
				mobileNo,
			});

		return await query.getOne();
	}

	public async getUserByTrackingId(trackingId?: string): Promise<User> {
		if (!trackingId) return null;

		const repository = await this.getRepository();
		const query = repository
			.createQueryBuilder('u')
			.innerJoinAndSelect('u._anonymousUser', 'anonymous', 'anonymous."_trackingId" = :trackingId', {
				trackingId,
			});

		return await query.getOne();
	}

	public async getUserByMolUserId(molUserId?: string): Promise<User> {
		if (!molUserId) return null;

		const repository = await this.getRepository();
		const query = repository
			.createQueryBuilder('u')
			.innerJoinAndSelect('u._singPassUser', 'singpass', 'singpass."_molUserId" = :molUserId', { molUserId });

		return await query.getOne();
	}

	public async getUserByUinFin(uinFin?: string): Promise<User> {
		if (!uinFin) return null;

		const repository = await this.getRepository();
		const query = repository
			.createQueryBuilder('u')
			.innerJoinAndSelect('u._singPassUser', 'singpass', 'singpass."_UinFin" = :uinFin', { uinFin });

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

	public async getUsersByMolAdminIds(molAdminIds: string[]): Promise<User[]> {
		if (!molAdminIds || molAdminIds.length === 0) return [];

		const repository = await this.getRepository();
		const query = repository
			.createQueryBuilder('u')
			.innerJoinAndSelect('u._adminUser', 'admuser', 'admuser."_molAdminId" IN (:...molAdminIds)', {
				molAdminIds,
			});

		return await query.getMany();
	}

	public async getUserByAgencyAppId(agencyAppId?: string): Promise<User> {
		if (!agencyAppId) return null;

		const repository = await this.getRepository();
		const query = repository
			.createQueryBuilder('u')
			.innerJoinAndSelect('u._agencyUser', 'agencyuser', 'agencyuser."_agencyAppId" = :agencyAppId', {
				agencyAppId,
			});

		return await query.getOne();
	}
}
