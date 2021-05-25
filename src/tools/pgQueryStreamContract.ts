import QueryStreamType from 'pg-query-stream';
const PgQueryStream = require('pg-query-stream');

export type QueryStreamConfig = {
	batchSize?: number;
	highWaterMark?: number;
	rowMode?: 'array';
	types?: any;
};

export function createQueryStream(text: string, values?: any[], config?: QueryStreamConfig): QueryStreamType {
	return new PgQueryStream(text, values, config);
}
