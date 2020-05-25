import { Body, Controller, Post, Route, SuccessResponse, Tags } from "tsoa";
import { AgencyRequest, AgencyResponse } from "./agency.apicontract";
import { Inject } from "typescript-ioc";
import { AgenciesService } from "./agencies.service";
import { Agency } from "../models";

@Route('**/v1/agencies')
@Tags('Agencies')
export class AgenciesController extends Controller {

	@Inject
	private agenciesService: AgenciesService;

	private static mapToAgencyResponse(agency: Agency) {
		const response = new AgencyResponse();
		response.name = agency.name;
		return response;
	}

	@Post()
	@SuccessResponse(201, "Created")
	public async createAgency(@Body() request: AgencyRequest): Promise<AgencyResponse> {
		return AgenciesController.mapToAgencyResponse(await this.agenciesService.createAgency(request));
	}
}
