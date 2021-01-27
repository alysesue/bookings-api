import { Connection, createConnection } from 'typeorm';
import { Container } from 'typescript-ioc';
import '../../infrastructure/tests/mockConfig';
import { DbConnection } from '../db.connection';

jest.mock('typeorm', () => {
	const actual = jest.requireActual('typeorm');
	actual.createConnection = jest.fn();
	return actual;
});

jest.mock('../connectionOptions');

describe('DbConnection', () => {
	beforeEach(() => {
		jest.resetAllMocks();
		(createConnection as jest.Mock).mockReturnValue({
			isConnected: true,
		} as Partial<Connection>);
	});

	it('should get connection', async () => {
		const o = Container.get(DbConnection);
		const connection = await o.getConnection();
		expect(connection).toBeDefined();
	});

	it('should get existing connection', async () => {
		const o = Container.get(DbConnection);
		expect(await o.getConnection()).toStrictEqual(await o.getConnection());
	});
});
