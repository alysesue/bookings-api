import { Inject } from "typescript-ioc";
import { DbConnection } from "../core/db.connection";
import { InsertResult, Repository } from "typeorm";
import { Agency } from "../models/agency";

export class AgenciesRepository {

	@Inject
	private connection: DbConnection;

	public async create(agency: Agency): Promise<InsertResult> {
		return (await this.getRepository()).insert(agency);
	}

	private async getRepository(): Promise<Repository<Agency>> {
		const conn = await this.connection.getConnection();
		return conn.getRepository(Agency);
	}
}
