import { SelectQueryBuilder } from 'typeorm';
import { IPagedEntities, MAX_PAGING_LIMIT } from './pagedEntities';

export class PagingHelper {
	private constructor() {}

	private static async getAllAsPaging<T>(query: SelectQueryBuilder<T>): Promise<IPagedEntities<T>> {
		const entries = await new SelectQueryBuilder<T>(query).getMany();
		const result: IPagedEntities<T> = {
			entries,
			page: 1,
			limit: MAX_PAGING_LIMIT,
			total: entries.length,
			maxId: 0,
			outdatedMaxId: false,
			hasMore: false,
		};

		return result;
	}

	public static async getManyWithPaging<T>(
		query: SelectQueryBuilder<T>,
		idColumn: string,
		pagingOptions: { page: number; limit: number; maxId?: number },
	): Promise<IPagedEntities<T>> {
		const { page, limit, maxId: initialMaxId } = pagingOptions;
		if (!page || page < 1) {
			throw new Error('Page number must be at least 1');
		}

		if (!limit || limit < 1) {
			throw new Error('Limit must be at least 1');
		}

		if (page === 1 && limit === MAX_PAGING_LIMIT) {
			return await PagingHelper.getAllAsPaging(query);
		}

		const { paging_max_id } = await new SelectQueryBuilder<T>(query)
			.orderBy()
			.select(`MAX(${idColumn})`, 'paging_max_id')
			.getRawOne<{
				paging_max_id: any;
			}>();
		const maxIdDBValue = Number.parseInt(`${paging_max_id}`, 10) || 0;
		const pagingMaxId = initialMaxId || maxIdDBValue;

		const { paging_count_value } = await new SelectQueryBuilder<T>(query)
			.orderBy()
			.andWhere(`${idColumn} <= :pagingMaxId`, { pagingMaxId })
			.select(`COUNT(DISTINCT(${idColumn}))`, 'paging_count_value')
			.getRawOne<{
				paging_count_value: any;
			}>();
		const total = Number.parseInt(`${paging_count_value}`, 10) || 0;

		const pagingQuery = new SelectQueryBuilder<T>(query)
			.andWhere(`${idColumn} <= :pagingMaxId`, { pagingMaxId })
			.skip(limit * (page - 1))
			.take(limit);

		const maxPage = Math.ceil(total / limit);
		const entries = await pagingQuery.getMany();
		const result: IPagedEntities<T> = {
			entries,
			page,
			limit,
			total,
			maxId: pagingMaxId,
			outdatedMaxId: !!initialMaxId && maxIdDBValue !== initialMaxId,
			hasMore: maxPage > page,
		};

		return result;
	}
}
