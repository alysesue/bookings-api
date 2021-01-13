import { Connection, createConnection } from 'typeorm';
import { Singleton } from 'typescript-ioc';
import { getConnectionOptions } from './connectionOptions';

@Singleton
export class DbConnection {
	protected static CONNECTION: Connection = null;

	public async runMigrations() {
		const conn = await this.getConnection();
		await conn.runMigrations({
			transaction: 'all',
		});
	}

	public async getConnection(): Promise<Connection> {
		if (DbConnection.CONNECTION === null) {
			await this.initConnection();
		}

		return DbConnection.CONNECTION;
	}

	protected async initConnection() {
		const options = getConnectionOptions();
		DbConnection.CONNECTION = await createConnection(options);
	}
}
