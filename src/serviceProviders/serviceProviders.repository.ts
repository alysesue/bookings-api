import { logger } from "mol-lib-common/debugging/logging/LoggerV2";
import { Inject, Singleton } from "typescript-ioc";
import { InsertResult, Repository } from "typeorm";
import { DbConnection } from "../core/db.connection";
import { ServiceProvider } from "../models";

@Singleton
export class ServiceProvidersRepository {
	@Inject
	private connection: DbConnection;

	public async getServiceProviders(): Promise<ServiceProvider[]> {
		const repository = await this.getRepository();
		return repository.find();
	}

	public async getServiceProvider(id: string): Promise<ServiceProvider> {
		const repository = await this.getRepository();
		return repository.findOne(id);
	}

	public async saveBulk(serviceProviders: ServiceProvider[]): Promise<InsertResult> {
		const repository = await this.getRepository();
		return repository.insert(serviceProviders);
	}

	private async getRepository(): Promise<Repository<ServiceProvider>> {
		try {
			const conn = await this.connection.getConnection();
			return conn.getRepository(ServiceProvider);
		} catch (e) {
			logger.error("ServiceProviderRepository::connection::error", e);
			throw e;
		}
	}
}
