import { Inject, InRequestScope } from 'typescript-ioc';
import { BookingChangeLog } from '../../models';
import { RepositoryBase } from '../../core/repository';
import { UserContext } from '../../infrastructure/auth/userContext';
import { groupByKey } from '../../tools/collections';
import { BookingChangeLogsQueryAuthVisitor } from './bookingChangeLogs.auth';

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
		const authGroups = await this.userContext.getAuthGroups();
		const { userCondition, userParams } = options.byPassAuth
			? { userCondition: '', userParams: {} }
			: await new BookingChangeLogsQueryAuthVisitor(
				'changelog',
				'service',
				'booking',
			).createUserVisibilityCondition(authGroups);

		const { changedSince, changedUntil, serviceId, bookingIds } = options;

		const serviceCondition = serviceId ? 'changelog."_serviceId" = :serviceId' : '';
		const dateCondition = 'changelog."_timestamp" >= :changedSince AND changelog."_timestamp" < :changedUntil';
		const bookingIdsCondition = bookingIds ? 'changelog."_bookingId" IN (:...bookingIds)' : '';

		const repository = await this.getRepository();
		const query = repository
			.createQueryBuilder('changelog')
			.where(
				[userCondition, serviceCondition, dateCondition, bookingIdsCondition]
					.filter((c) => c)
					.map((c) => `(${c})`)
					.join(' AND '),
				{ ...userParams, changedSince, changedUntil, serviceId, bookingIds },
			)
			.leftJoinAndSelect('changelog._user', 'loguser')
			.leftJoinAndSelect('loguser._singPassUser', 'singpass')
			.leftJoinAndSelect('loguser._adminUser', 'admin')
			.leftJoinAndSelect('loguser._agencyUser', 'agency')
			.leftJoinAndSelect('changelog._service', 'service')
			.leftJoinAndSelect('changelog._booking', 'booking')
			.leftJoinAndSelect('booking._serviceProvider', 'sp');

		const entries = await query.getMany();

		return groupByKey(entries, (log) => log.bookingId);
	}
}

export type ChangeLogSearchQuery = {
	changedSince: Date;
	changedUntil: Date;
	serviceId?: number;
	bookingIds: number[];
	byPassAuth?: boolean;
};
