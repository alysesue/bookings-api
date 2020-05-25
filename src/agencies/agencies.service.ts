import { Inject, Singleton } from "typescript-ioc";
import { AgencyRequest } from "./agency.apicontract";
import { AgenciesRepository } from "./agencies.repository";
import { Agency } from "../models/agency";

@Singleton
export class AgenciesService {

	@Inject
	private agenciesRepository: AgenciesRepository;

	public async createAgency(request: AgencyRequest): Promise<Agency> {
		const agency = new Agency();
		agency.name = request.name;

		await this.agenciesRepository.create(agency);
		return agency;
	}
}
