import { Connection, Repository } from "typeorm";
import { Inject } from "typescript-ioc";
import { DbConnection } from "./db.connection";
import { logger } from "mol-lib-common/debugging/logging/LoggerV2";

export abstract class RepositoryBase<T> {

	@Inject
	private connection: DbConnection;

	private readonly modelType;

	protected constructor(modelType) {
		this.modelType = modelType;
	}

	protected async getRepository(): Promise<Repository<T>> {
		try {
			const conn = await this.connection.getConnection();
			return conn.getRepository<T>(this.modelType);
		} catch (e) {
			logger.error("ServiceProviderRepository::connection::error", e);
			throw e;
		}
	}

	protected async getConnection(): Promise<Connection> {
		return this.connection.getConnection();
	}
}

export enum QueryAccessType {
	Read = 1,
	Write
}
