import { Connection, createConnection } from 'typeorm';
import { Singleton } from 'typescript-ioc';

import { connectionOptions } from './connectionOptions';

@Singleton
export class DbConnection {
	protected static CONNECTION: Connection = null;

	protected async initConnection() {
		DbConnection.CONNECTION = await createConnection(connectionOptions);
	}

	public async runMigrations() {
		await (await this.getConnection()).runMigrations();
	}

	public async getConnection(): Promise<Connection> {
		if (DbConnection.CONNECTION === null) {
			await this.initConnection();
		}
		return DbConnection.CONNECTION;
	}
}
