import { Inject, Singleton } from "typescript-ioc";
import { DbConnection } from "../core/db.connection";
import { InsertResult, Repository } from "typeorm";
import { Service } from "../models";

@Singleton
export class ServicesRepository {

	@Inject
	private connection: DbConnection;

	public async create(agency: Service): Promise<InsertResult> {
		return (await this.getRepository()).insert(agency);
	}

	private async getRepository(): Promise<Repository<Service>> {
		const conn = await this.connection.getConnection();
		return conn.getRepository(Service);
	}
}
