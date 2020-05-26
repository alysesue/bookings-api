import { Body, Controller, Post, Route, SuccessResponse, Tags } from "tsoa";
import { ServiceRequest, ServiceResponse } from "./service.apicontract";
import { Inject } from "typescript-ioc";
import { ServicesService } from "./services.service";

@Route('**/v1/services')
@Tags('Services')
export class ServicesController extends Controller {

	@Inject
	private servicesService: ServicesService;

	private static mapToServiceResponse(agency: Agency) {
		const response = new ServiceResponse();
		response.name = agency.name;
		return response;
	}

	@Post()
	@SuccessResponse(201, "Created")
	public async createAgency(@Body() request: ServiceRequest): Promise<ServiceResponse> {
		return ServicesController.mapToServiceResponse(await this.servicesService.createService(request));
	}
}
