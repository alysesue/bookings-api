import { Inject, InRequestScope } from 'typescript-ioc';
import { EntityManager } from 'typeorm';
import { IsolationLevel } from 'typeorm/driver/types/IsolationLevel';
import { DbConnection } from './db.connection';

export const DefaultIsolationLevel: IsolationLevel = 'READ COMMITTED';

export type AsyncFunction<T> = () => Promise<T>;

@InRequestScope
export class TransactionManager {
	@Inject
	private _dbConnection: DbConnection;
	private _isolationLevel?: IsolationLevel;
	private _transactionalManager?: EntityManager;

	private async getEntityManagerInternal(): Promise<EntityManager> {
		const conn = await this._dbConnection.getConnection();
		return conn.manager;
	}

	public async getEntityManager(): Promise<EntityManager> {
		if (this._transactionalManager) {
			return this._transactionalManager;
		}

		return await this.getEntityManagerInternal();
	}

	public async runInTransaction<T>(isolationLevel: IsolationLevel, asyncFunction: AsyncFunction<T>): Promise<T> {
		// Runs in current transaction if it exists
		if (this._transactionalManager) {
			if (this._isolationLevel !== isolationLevel) {
				throw new Error(
					`There's already a transaction in place [${this._isolationLevel}] which doesn't match the requested isolation level: [${isolationLevel}]`,
				);
			}

			return await asyncFunction();
		}

		// Creates new transaction
		const manager = await this.getEntityManagerInternal();
		return await manager.transaction<T>(isolationLevel, async (transactionalManager) => {
			this._isolationLevel = isolationLevel;
			this._transactionalManager = transactionalManager;
			try {
				return await asyncFunction();
			} finally {
				this._isolationLevel = undefined;
				this._transactionalManager = undefined;
			}
		});
	}
}
