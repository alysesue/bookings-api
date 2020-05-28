import { Inject, Singleton } from "typescript-ioc";
import { Service } from "../models";
import { ServicesRepository } from "./services.repository";
import { ServiceRequest } from "./service.apicontract";

@Singleton
export class ServicesService {

	@Inject
	private servicesRepository: ServicesRepository;

	public async createService(request: ServiceRequest): Promise<Service> {
		const service = new Service();
		service.name = request.name;

		await this.servicesRepository.create(service);
		return service;
	}

	public async getServices(): Promise<Service[]> {
		return await this.servicesRepository.getAll();
	}
}
