import { SelectQueryBuilder } from 'typeorm';
import { IPagedEntities, MAX_PAGING_LIMIT } from '../pagedEntities';
import { PagingHelper } from '../paging';

class SampleEntity {}

describe('PagingHelper tests', () => {
	const queryBuilderMock = {
		select: jest.fn(),
		addSelect: jest.fn(),
		where: jest.fn(),
		andWhere: jest.fn(),
		leftJoinAndSelect: jest.fn(),
		leftJoinAndMapOne: jest.fn(),
		orderBy: jest.fn(),
		skip: jest.fn(),
		take: jest.fn(),
		getMany: jest.fn<Promise<any[]>, any>(),
		getRawOne: jest.fn<Promise<{ paging_max_id: string; paging_count_value: string }>, any>(),
	};

	const queryBuilderConstructor = () => (queryBuilderMock as unknown) as SelectQueryBuilder<SampleEntity>;

	beforeEach(() => {
		jest.resetAllMocks();

		queryBuilderMock.select.mockImplementation(() => queryBuilderMock);
		queryBuilderMock.addSelect.mockImplementation(() => queryBuilderMock);
		queryBuilderMock.where.mockImplementation(() => queryBuilderMock);
		queryBuilderMock.andWhere.mockImplementation(() => queryBuilderMock);
		queryBuilderMock.leftJoinAndSelect.mockImplementation(() => queryBuilderMock);
		queryBuilderMock.leftJoinAndMapOne.mockImplementation(() => queryBuilderMock);
		queryBuilderMock.orderBy.mockImplementation(() => queryBuilderMock);
		queryBuilderMock.skip.mockImplementation(() => queryBuilderMock);
		queryBuilderMock.take.mockImplementation(() => queryBuilderMock);

		queryBuilderMock.getRawOne.mockImplementation(() =>
			Promise.resolve({ paging_max_id: '0', paging_count_value: '0' }),
		);

		queryBuilderMock.getMany.mockImplementation(() => Promise.resolve([]));

		(SelectQueryBuilder as jest.Mock).mockImplementation(queryBuilderConstructor);
	});

	it('should throw when page < 1', async () => {
		const testCase = async () =>
			await PagingHelper.getManyWithPaging(queryBuilderConstructor(), 'table._id', { page: 0, limit: 1 });

		await expect(testCase).rejects.toThrowError();
	});

	it('should throw when page is undefined', async () => {
		const testCase = async () =>
			await PagingHelper.getManyWithPaging(queryBuilderConstructor(), 'table._id', { page: undefined, limit: 1 });

		await expect(testCase).rejects.toThrowError();
	});

	it('should throw when limit < 1', async () => {
		const testCase = async () =>
			await PagingHelper.getManyWithPaging(queryBuilderConstructor(), 'table._id', { page: 1, limit: 0 });

		await expect(testCase).rejects.toThrowError();
	});

	it('should throw when limit is undefined', async () => {
		const testCase = async () =>
			await PagingHelper.getManyWithPaging(queryBuilderConstructor(), 'table._id', { page: 1, limit: undefined });

		await expect(testCase).rejects.toThrowError();
	});

	it('should get paged result', async () => {
		queryBuilderMock.getRawOne.mockImplementation(() =>
			Promise.resolve({ paging_max_id: '20', paging_count_value: '500' }),
		);

		queryBuilderMock.getMany.mockImplementation(() => Promise.resolve([new SampleEntity(), new SampleEntity()]));

		const result = await PagingHelper.getManyWithPaging(queryBuilderConstructor(), 'table._id', {
			page: 3,
			limit: 50,
		});

		expect(result).toEqual({
			entries: [{}, {}],
			page: 3,
			limit: 50,
			total: 500,
			maxId: 20,
			outdatedMaxId: false,
			hasMore: true,
		} as IPagedEntities<SampleEntity>);

		expect(queryBuilderMock.andWhere).toHaveBeenCalledWith('table._id <= :pagingMaxId', {
			pagingMaxId: 20,
		});
		expect(queryBuilderMock.skip).toHaveBeenCalledWith(100);
		expect(queryBuilderMock.take).toHaveBeenCalledWith(50);
		expect(queryBuilderMock.getMany).toBeCalled();
	});

	it('should get paged result (with maxId)', async () => {
		queryBuilderMock.getRawOne.mockImplementation(() =>
			Promise.resolve({ paging_max_id: '20', paging_count_value: '500' }),
		);

		queryBuilderMock.getMany.mockImplementation(() => Promise.resolve([new SampleEntity(), new SampleEntity()]));

		const result = await PagingHelper.getManyWithPaging(queryBuilderConstructor(), 'table._id', {
			page: 4,
			limit: 50,
			maxId: 854,
		});

		expect(result).toEqual({
			entries: [{}, {}],
			page: 4,
			limit: 50,
			total: 500,
			maxId: 854,
			outdatedMaxId: true,
			hasMore: true,
		} as IPagedEntities<SampleEntity>);

		expect(queryBuilderMock.andWhere).toHaveBeenCalledWith('table._id <= :pagingMaxId', {
			pagingMaxId: 854,
		});
		expect(queryBuilderMock.skip).toHaveBeenCalledWith(150);
		expect(queryBuilderMock.take).toHaveBeenCalledWith(50);
		expect(queryBuilderMock.getMany).toBeCalled();
	});

	it('should get paged result (with EMPTY maxId)', async () => {
		queryBuilderMock.getRawOne.mockImplementation(() =>
			Promise.resolve({ paging_max_id: '', paging_count_value: '' }),
		);

		queryBuilderMock.getMany.mockImplementation(() => Promise.resolve([]));

		const result = await PagingHelper.getManyWithPaging(queryBuilderConstructor(), 'table._id', {
			page: 1,
			limit: 50,
		});

		expect(result).toEqual({
			entries: [],
			page: 1,
			limit: 50,
			total: 0,
			maxId: 0,
			outdatedMaxId: false,
			hasMore: false,
		} as IPagedEntities<SampleEntity>);

		expect(queryBuilderMock.andWhere).toHaveBeenCalledWith('table._id <= :pagingMaxId', {
			pagingMaxId: 0,
		});
		expect(queryBuilderMock.skip).toHaveBeenCalledWith(0);
		expect(queryBuilderMock.take).toHaveBeenCalledWith(50);
		expect(queryBuilderMock.getMany).toBeCalled();
	});

	it('should get all results when limit is set to MAX_PAGING_LIMIT', async () => {
		queryBuilderMock.getMany.mockImplementation(() => Promise.resolve([new SampleEntity(), new SampleEntity()]));

		const result = await PagingHelper.getManyWithPaging(queryBuilderConstructor(), 'table._id', {
			page: 1,
			limit: MAX_PAGING_LIMIT,
		});

		expect(result).toEqual({
			entries: [{}, {}],
			page: 1,
			limit: MAX_PAGING_LIMIT,
			total: 2,
			maxId: 0,
			outdatedMaxId: false,
			hasMore: false,
		} as IPagedEntities<SampleEntity>);

		expect(queryBuilderMock.skip).not.toHaveBeenCalled();
		expect(queryBuilderMock.take).not.toHaveBeenCalled();
		expect(queryBuilderMock.getMany).toBeCalled();
	});
});
