import { Inject, InRequestScope } from 'typescript-ioc';
import { BookingChangeLog } from '../../models';
import { RepositoryBase } from '../../core/repository';
import { UserContext } from '../../infrastructure/userContext.middleware';
import { groupByKey } from '../../tools/collections';

@InRequestScope
export class BookingChangeLogsRepository extends RepositoryBase<BookingChangeLog> {
	@Inject
	private userContext: UserContext;

	constructor() {
		super(BookingChangeLog);
	}

	public async save(changeLog: BookingChangeLog): Promise<BookingChangeLog> {
		const repository = await this.getRepository();
		return repository.save(changeLog);
	}

	public async getLogs(options: ChangeLogSearchQuery): Promise<Map<number, BookingChangeLog[]>> {
		const { changedSince, changedUntil, serviceId, bookingIds } = options;

		const serviceCondition = serviceId ? 'changelog."_serviceId" = :serviceId' : '';
		const dateCondition = 'changelog."_timestamp" >= :changedSince AND changelog."_timestamp" < :changedUntil';
		const bookingIdsCondition = bookingIds ? 'changelog."_bookingId" IN (:...bookingIds)' : '';

		const repository = await this.getRepository();
		const query = repository.createQueryBuilder('changelog').where(
			[serviceCondition, dateCondition, bookingIdsCondition]
				.filter((c) => c)
				.map((c) => `(${c})`)
				.join(' AND '),
			{ changedSince, changedUntil, serviceId, bookingIds },
		);

		const entries = await query.getMany();

		return groupByKey(entries, (log) => log.bookingId);
	}
}

export type ChangeLogSearchQuery = {
	changedSince: Date;
	changedUntil: Date;
	serviceId?: number;
	bookingIds: number[];
};
