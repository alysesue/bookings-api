import { Readable } from 'stream';
import { EventIterator } from 'event-iterator';
import { EventIteratorOptions } from 'event-iterator/lib/event-iterator';

export interface IGroupRecordIterator<T> {
	getRecords(): AsyncIterable<[number, T[]]>;
}

export class GroupRecordIterator<TInput, TOutput> implements IGroupRecordIterator<TOutput> {
	_creator: () => Promise<Readable>;
	_disposer: () => Promise<void>;
	_disposed: boolean;
	_groupByProperty: string;
	_mapper: (input: TInput) => TOutput;

	constructor(
		streamCreator: () => Promise<Readable>,
		disposer: () => Promise<void>,
		groupByProperty: string,
		mapper: (input: TInput) => TOutput,
	) {
		this._creator = streamCreator;
		this._disposer = disposer;
		this._disposed = false;
		this._groupByProperty = groupByProperty;
		this._mapper = mapper;
	}

	public async dispose(): Promise<void> {
		if (!this._disposed) {
			this._disposed = true;
			await this._disposer();
		}
	}

	public async *getRecords(): AsyncIterable<[number, TOutput[]]> {
		try {
			const _stream = await this._creator();

			const options = {
				highWaterMark: 20, // Max number of groups (each group has an array of records)
				lowWaterMark: 2, // Resume stream at this mark
			} as Partial<EventIteratorOptions>;
			const eventIterator = new EventIterator<[number, TOutput[]]>((queue) => {
				let groupBatch: TOutput[] = [];
				let currentGroupId: number;

				const _dataListener = (chunk: TInput) => {
					const groupId = chunk[this._groupByProperty];
					const mapped = this._mapper(chunk);
					if (currentGroupId === undefined) {
						currentGroupId = groupId;
						groupBatch.push(mapped);
						return;
					}

					if (currentGroupId === groupId) {
						groupBatch.push(mapped);
					} else if (groupId < currentGroupId) {
						throw new Error('Stream must be ordered by groupId.');
					} else {
						queue.push([currentGroupId, groupBatch]);
						groupBatch = [];
						currentGroupId = groupId;
						groupBatch.push(mapped);
					}
				};
				const _endListener = () => {
					if (groupBatch.length > 0) {
						queue.push([currentGroupId, groupBatch]);
					}
					queue.stop();
				};
				const _errorListener = (error: Error) => {
					queue.fail(error);
				};

				_stream.on('data', _dataListener);
				_stream.on('end', _endListener);
				_stream.on('error', _errorListener);

				queue.on('highWater', () => {
					_stream.pause();
				});
				queue.on('lowWater', () => {
					_stream.resume();
				});

				return () => {
					_stream.removeAllListeners();
				};
			}, options);

			yield* eventIterator;
		} finally {
			await this.dispose();
		}
	}
}

export class EmptyGroupRecordIterator<T> implements IGroupRecordIterator<T> {
	public async *getRecords(): AsyncIterable<[number, T[]]> {
		return;
	}
}
