import { Repository, EntitySchema } from "typeorm";
import { Inject, Singleton } from "typescript-ioc";
import { DbConnection } from "./db.connection";
import { logger } from "mol-lib-common/debugging/logging/LoggerV2";

@Singleton
export abstract class RepositoryBase {

	@Inject
	private connection: DbConnection;

	modelType;

	protected constructor(modelType) {
		this.modelType = modelType;
	}

	protected async getRepository<T>(): Promise<Repository<T>> {
		try {
			const conn = await this.connection.getConnection();
			return conn.getRepository<T>(this.modelType);
		} catch (e) {
			logger.error("ServiceProviderRepository::connection::error", e);
			throw e;
		}
	}
}
