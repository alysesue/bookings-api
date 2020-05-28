import { Singleton } from "typescript-ioc";
import { InsertResult } from "typeorm";
import { Service } from "../models";
import { RepositoryBase } from "../core/repository";

@Singleton
export class ServicesRepository extends RepositoryBase<Service> {

	constructor() {
		super(Service);
	}

	public async create(service: Service): Promise<InsertResult> {
		return (await this.getRepository()).insert(service);
	}

	public async getAll(): Promise<Service[]> {
		return (await this.getRepository()).find();
	}
}
