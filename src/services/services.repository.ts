import { InRequestScope } from "typescript-ioc";
import { Service } from "../models";
import { RepositoryBase } from "../core/repository";

@InRequestScope
export class ServicesRepository extends RepositoryBase<Service> {

	constructor() {
		super(Service);
	}

	public async save(service: Service): Promise<Service> {
		return (await this.getRepository()).save(service);
	}

	public async getAll(): Promise<Service[]> {
		return (await this.getRepository()).find();
	}

	public async findOne(options: any) {
		return (await this.getRepository()).findOne(options);
	}
	public async getService(id: number): Promise<Service> {
		return (await this.getRepository()).findOne(id);
	}
}
