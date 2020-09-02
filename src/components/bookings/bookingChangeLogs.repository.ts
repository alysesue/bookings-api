import { Inject, InRequestScope } from "typescript-ioc";
import { BookingChangeLog } from "../../models";
import { RepositoryBase } from "../../core/repository";
import { UserContext } from "../../infrastructure/userContext.middleware";

@InRequestScope
export class BookingChangeLogsRepository extends RepositoryBase<BookingChangeLog> {
	@Inject
	private userContext: UserContext;

	constructor() {
		super(BookingChangeLog);
	}

	public async saveLogAndBooking(changeLog: BookingChangeLog): Promise<BookingChangeLog> {
		const repository = await this.getRepository();
		return repository.save(changeLog);
	}

	// private async createQueryForUser(_accessType: QueryAccessType): Promise<SelectQueryBuilder<Booking>> {
	// 	const user = await this.userContext.getCurrentUser();

	// 	const repository = await this.getRepository();
	// 	let query = repository.createQueryBuilder("booking");
	// 	if (user.isCitizen()) {
	// 		query = query.where('booking."_citizenUinFin" = :uinfin', { uinfin: user.singPassUser.UinFin });
	// 	}

	// 	return query;
	// }

	// public async search({ serviceId, serviceProviderId, statuses, from, to, accessType }:
	// 	{
	// 		serviceId?: number,
	// 		serviceProviderId?: number,
	// 		statuses?: BookingStatus[],
	// 		from: Date,
	// 		to: Date,
	// 		accessType: QueryAccessType
	// 	}): Promise<BookingChangeLog[]> {

	// 	const serviceCondition = serviceId ? 'booking."_serviceId" = :serviceId' : '';

	// 	const serviceProviderCondition = serviceProviderId ? 'booking."_serviceProviderId" = :serviceProviderId' : '';

	// 	const statusesCondition = statuses ? 'booking."_status" IN (:...statuses)' : '';

	// 	const dateRangeCondition = '(booking."_startDateTime" < :to AND booking."_endDateTime" > :from)';

	// 	const query = (await this.createQueryForUser(accessType))
	// 		.where([serviceCondition, serviceProviderCondition, dateRangeCondition, statusesCondition].filter(c => c).join(' AND '),
	// 			{ serviceId, serviceProviderId, from, to, statuses })
	// 		.leftJoinAndSelect("booking._serviceProvider", "sp_relation")
	// 		.leftJoinAndSelect("booking._service", "service_relation")
	// 		.orderBy("booking._id", "DESC");

	// 	return await query.getMany();
	// }
}
