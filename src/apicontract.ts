import { Inject, InRequestScope } from 'typescript-ioc';
import { IPagedEntities } from './core/pagedEntities';
import { IdHasher } from './infrastructure/idHasher';

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

export class PagingRequest {
	public page: number;
	public limit: number;
	public maxId?: number;
}

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

export class ApiPagingInfoV2 {
	public page: number;
	public limit: number;
	public total: number;
	public maxId: string;
	public outdatedMaxId: boolean;
	public hasMore: boolean;
}

export class ApiPagedDataV2<T> {
	public data: T[];
	public paging: ApiPagingInfoV2;
}

export type MapFunction<TInput, TOutput> = (input: TInput) => TOutput;

export type MapFunctionAsync<TInput, TOutput> = (input: TInput) => Promise<TOutput>;

export class ApiDataFactory {
	private constructor() {}
	public static create<T>(data: T): ApiData<T> {
		return new ApiData(data);
	}

	public static createBulk<T, F>(created: T, failedBookings: F): ApiDataBulk<T, F> {
		return new ApiDataBulk(created, failedBookings);
	}
}

@InRequestScope
export class ApiPagingFactory {
	@Inject
	private idHasher: IdHasher;

	private createPagingInfo(pagedEntities: IPagedEntities<any>): ApiPagingInfo {
		const info = new ApiPagingInfo();
		info.page = pagedEntities.page;
		info.limit = pagedEntities.limit;
		info.total = pagedEntities.total;
		info.maxId = pagedEntities.maxId;
		info.outdatedMaxId = pagedEntities.outdatedMaxId;
		info.hasMore = pagedEntities.hasMore;
		return info;
	}

	private createPagingInfoV2(pagedEntities: IPagedEntities<any>): ApiPagingInfoV2 {
		const info = new ApiPagingInfoV2();
		info.page = pagedEntities.page;
		info.limit = pagedEntities.limit;
		info.total = pagedEntities.total;
		info.maxId = this.idHasher.encode(pagedEntities.maxId);
		info.outdatedMaxId = pagedEntities.outdatedMaxId;
		info.hasMore = pagedEntities.hasMore;
		return info;
	}

	public async createPagedAsync<TInput, TOutput>(
		pagedEntities: IPagedEntities<TInput>,
		mapFunction: MapFunctionAsync<TInput, TOutput> | MapFunction<TInput, TOutput>,
	): Promise<ApiPagedData<TOutput>> {
		const pagedData = new ApiPagedData<TOutput>();
		pagedData.data = [];
		for (const entry of pagedEntities.entries) {
			const mappedResult = await mapFunction(entry);
			pagedData.data.push(mappedResult);
		}
		pagedData.paging = this.createPagingInfo(pagedEntities);
		return pagedData;
	}

	public async createPagedV2Async<TInput, TOutput>(
		pagedEntities: IPagedEntities<TInput>,
		mapFunction: MapFunctionAsync<TInput, TOutput> | MapFunction<TInput, TOutput>,
	): Promise<ApiPagedDataV2<TOutput>> {
		const pagedData = new ApiPagedDataV2<TOutput>();
		pagedData.data = [];
		for (const entry of pagedEntities.entries) {
			const mappedResult = await mapFunction(entry);
			pagedData.data.push(mappedResult);
		}
		pagedData.paging = this.createPagingInfoV2(pagedEntities);
		return pagedData;
	}
}
