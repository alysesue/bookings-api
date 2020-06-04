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

		return await this.servicesRepository.save(service);
	}

	public async getServices(): Promise<Service[]> {
		return await this.servicesRepository.getAll();
	}

	public async getByName(service: string): Promise<Service> {
		return await this.servicesRepository.findOne({_name: service});
	}
	public async getService(id: number): Promise<Service> {
		return await this.servicesRepository.getService(id);
	}
}
