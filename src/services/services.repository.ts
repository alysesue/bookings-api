import { Singleton } from "typescript-ioc";
import { Service } from "../models";
import { RepositoryBase } from "../core/repository";

@Singleton
export class ServicesRepository extends RepositoryBase<Service> {

	constructor() {
		super(Service);
	}

	public async save(service: Service): Promise<Service> {
		return (await this.getRepository()).save(service);
	}

	public async get(id: number): Promise<Service> {
		return (await this.getRepository()).findOne({ where: { _id: id } });
	}

	public async getAll(): Promise<Service[]> {
		return (await this.getRepository()).find();
	}
}
