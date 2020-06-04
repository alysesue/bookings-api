import { Body, Controller, Get, Post, Route, SuccessResponse, Tags } from "tsoa";
import { ServiceRequest, ServiceResponse } from "./service.apicontract";
import { Inject } from "typescript-ioc";
import { ServicesService } from "./services.service";
import { Service } from "../models";

@Route('**/v1/services')
@Tags('Services')
export class ServicesController extends Controller {

	@Inject
	private servicesService: ServicesService;

	private static mapToServiceResponse(service: Service) {
		const response = new ServiceResponse();
		response.name = service.name;
		return response;
	}

	@Post()
	@SuccessResponse(201, "Created")
	public async createService(@Body() request: ServiceRequest): Promise<ServiceResponse> {
		return ServicesController.mapToServiceResponse(await this.servicesService.createService(request));
	}

	@Get()
	@SuccessResponse(200, "Ok")
	public async getServices(): Promise<ServiceResponse[]> {
		const services = await this.servicesService.getServices();
		return services.map(ServicesController.mapToServiceResponse);
	}

	@Get("{serviceId}")
	@SuccessResponse(200, "Ok")
	public async getService(serviceId: number): Promise<ServiceResponse> {
		const service = await this.servicesService.getService(serviceId);
		return ServicesController.mapToServiceResponse(service);
	}
}
