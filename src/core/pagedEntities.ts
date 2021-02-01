export interface IPagedEntities<T> {
	readonly entries: T[];
	readonly page: number;
	readonly limit: number;
	readonly total: number;
	readonly maxId: number;
	readonly outdatedMaxId: boolean;
	readonly hasMore: boolean;
}

export const MAX_PAGING_LIMIT = Number.MAX_SAFE_INTEGER;
