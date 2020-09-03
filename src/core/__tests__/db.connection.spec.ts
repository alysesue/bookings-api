import '../../infrastructure/tests/mockConfig';
import { DbConnection } from '../db.connection';

jest.mock('../connectionOptions');

describe('DbConnection', () => {
	it('should get connection', () => {
		const o = new DbConnectionMock();
		expect(o.getConnection());
	});

	it('should get existing connection', () => {
		const o = new DbConnectionMock();
		expect(o.getConnection()).toStrictEqual(o.getConnection());
	});
});

class DbConnectionMock extends DbConnection {
	protected async initConnection(): Promise<void> {
		// @ts-ignore
		DbConnection.CONNECTION = jest.fn();
	}
}
