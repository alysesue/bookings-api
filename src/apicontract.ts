import { IPagedEntities } from './core/pagedEntities';

export class ApiData<T> {
	public data: T;
	constructor(typedData: T) {
		this.data = typedData;
	}
}

export class FailedRecord<Request, Reason> {
	public request: Request;
	public reason: Reason;
	constructor(request: Request, reason: Reason) {
		this.request = request;
		this.reason = reason;
	}
}
export class ApiDataBulk<T, FailedRecords> {
	public created: T;
	public failed: FailedRecords;
	constructor(typedData: T, failedRecords: FailedRecords) {
		this.created = typedData;
		this.failed = failedRecords;
	}
}

export type PagingRequest = {
	page: number;
	limit: number;
	maxId?: number;
};

export class ApiPagingInfo {
	public page: number;
	public limit: number;
	public total: number;
	public maxId: number;
	public outdatedMaxId: boolean;
	public hasMore: boolean;
}

export class ApiPagedData<T> {
	public data: T[];
	public paging: ApiPagingInfo;
}

export type MapFunction<TInput, TOutput> = (input: TInput) => TOutput;
export class ApiDataFactory {
	private constructor() {}
	public static create<T>(data: T): ApiData<T> {
		return new ApiData(data);
	}

	public static createBulk<T, F>(created: T, failedBookings: F): ApiDataBulk<T, F> {
		return new ApiDataBulk(created, failedBookings);
	}

	private static createPagingInfo(pagedEntities: IPagedEntities<any>): ApiPagingInfo {
		const info = new ApiPagingInfo();
		info.page = pagedEntities.page;
		info.limit = pagedEntities.limit;
		info.total = pagedEntities.total;
		info.maxId = pagedEntities.maxId;
		info.outdatedMaxId = pagedEntities.outdatedMaxId;
		info.hasMore = pagedEntities.hasMore;
		return info;
	}

	public static createPaged<TInput, TOutput>(
		pagedEntities: IPagedEntities<TInput>,
		mapFunction: MapFunction<TInput, TOutput>,
	): ApiPagedData<TOutput> {
		const pagedData = new ApiPagedData<TOutput>();
		pagedData.data = pagedEntities.entries.map(mapFunction);
		pagedData.paging = ApiDataFactory.createPagingInfo(pagedEntities);
		return pagedData;
	}
}
