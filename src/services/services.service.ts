import { Inject, InRequestScope, Scope, Scoped } from "typescript-ioc";
import { Service } from "../models";
import { ServicesRepository } from "./services.repository";
import { ServiceRequest } from "./service.apicontract";

@Scoped(Scope.Request)
@InRequestScope
export class ServicesService {

	@Inject
	private servicesRepository: ServicesRepository;

	public async createService(request: ServiceRequest): Promise<Service> {
		const service = new Service();
		service.name = request.name;

		return await this.servicesRepository.save(service);
	}

	public async getServices(): Promise<Service[]> {
		return await this.servicesRepository.getAll();
	}

	public async getService(id: number): Promise<Service> {
		return await this.servicesRepository.getService(id);
	}
}
