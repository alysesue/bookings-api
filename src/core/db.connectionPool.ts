import { Inject, Singleton } from 'typescript-ioc';
import { PostgresDriver } from 'typeorm/driver/postgres/PostgresDriver';
import { Pool, PoolClient } from 'pg';
import { DbConnection } from './db.connection';

@Singleton
export class ConnectionPool {
	@Inject
	private _dbConnection: DbConnection;

	private async getConnectionPool(): Promise<Pool> {
		const typeORMconnection = await this._dbConnection.getConnection();
		const driver = typeORMconnection.driver as PostgresDriver;
		const pool = driver.master as Pool;
		if (!pool) {
			throw new Error('Connection pool is disconnected.');
		}

		return pool;
	}

	public async getClient(): Promise<PoolClient> {
		const pool = await this.getConnectionPool();
		return await pool.connect();
	}
}
