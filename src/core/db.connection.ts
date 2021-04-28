import { Connection, createConnection } from 'typeorm';
import { Singleton } from 'typescript-ioc';
import { initPopulateDB } from '../migrations/seeds';
import { getConnectionOptions } from './connectionOptions';

@Singleton
export class DbConnection {
	protected static CONNECTION: Connection = null;

	public async synchronize() {
		const conn = await this.getConnection();
		await conn.synchronize();
	}

	public async runMigrations() {
		const conn = await this.getConnection();
		await conn.runMigrations({
			transaction: 'all',
		});
	}

	public async runPopulate() {
		const conn = await this.getConnection();
		const queryRunner = conn.createQueryRunner();
		await initPopulateDB(queryRunner);
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
