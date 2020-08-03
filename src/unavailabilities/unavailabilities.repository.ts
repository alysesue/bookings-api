import { InRequestScope } from "typescript-ioc";
import { RepositoryBase } from "../core/repository";
import { Unavailability } from "../models";
import { FindManyOptions } from "typeorm";

@InRequestScope
export class UnavailabilitiesRepository extends RepositoryBase<Unavailability> {
	constructor() {
		super(Unavailability);
	}

	public async save(data: Unavailability): Promise<Unavailability> {
		const repository = await this.getRepository();
		return await repository.save(data);
	}

	public async query({ serviceId }:
		{ serviceId: number }): Promise<Unavailability[]> {

		const repository = (await this.getRepository());
		const query = repository.createQueryBuilder("unavailability")
			.where("unavailability._serviceId = :serviceId", { serviceId })
			.relation('serviceProviders')
			.select();

		return await query.getMany();
	}
}
