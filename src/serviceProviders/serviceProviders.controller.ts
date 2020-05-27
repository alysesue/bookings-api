import { Inject } from "typescript-ioc";
import {
	ServiceProviderListRequest,
	ServiceProviderModel
} from "./serviceProviders.apicontract";
import { ServiceProvidersService } from "./serviceProviders.service";
import { ServiceProvider } from "../models";
import { Body, Controller, Get, Path, Post, Route, SuccessResponse, Tags } from "tsoa";
import { ErrorResponse } from "../apicontract";
import { parseCsv } from "../utils";

@Route("api/v1/serviceProviders")
@Tags('Service Providers')
export class ServiceProvidersController extends Controller {

	@Inject
	private serviceProvidersService: ServiceProvidersService;

	@Post("")
	@SuccessResponse(201, 'Created')
	public async addServiceProviders(@Body() spRequest: ServiceProviderListRequest): Promise<ServiceProviderModel[]> {
		const response = await this.serviceProvidersService.save(spRequest.serviceProviders);
		return ServiceProvidersController.mapDataModels(response);
	}

	@Post("/csv")
	@SuccessResponse(201, 'Created')
	public async addServiceProvidersText(@Body() spRequest: string): Promise<any> {
		try {
			const request = ServiceProvidersController.parseCsvModelToServiceProviders(parseCsv(spRequest));
			const response = await this.serviceProvidersService.save(request);
			return ServiceProvidersController.mapDataModels(response);
		} catch (e) {
			return new ErrorResponse(e.message);
		}
	}

	@Get("")
	public async getServiceProviders(): Promise<ServiceProviderModel[]> {
		const dataModels = await this.serviceProvidersService.getServiceProviders();
		return ServiceProvidersController.mapDataModels(dataModels);
	}

	@Get("{spId}")
	public async getServiceProvider(@Path() spId: string): Promise<ServiceProviderModel> {
		const dataModel = await this.serviceProvidersService.getServiceProvider(spId);
		return ServiceProvidersController.mapDataModel(dataModel);
	}

	private static mapDataModel(spData: ServiceProvider): ServiceProviderModel {
		return {
			id: spData.id,
			name: spData.name
		} as ServiceProviderModel;
	}

	private static mapDataModels(spList: ServiceProvider[]): ServiceProviderModel[] {
		return spList?.map(this.mapDataModel);
	}

	// TODO: write test for this one
	private static parseCsvModelToServiceProviders(csvModels: []) {
		try {

			const serviceProvidersRequest = csvModels as ServiceProviderModel[]

			if (serviceProvidersRequest.length !== csvModels.length) {
				throw new Error("Invalid model format");
			}
			return serviceProvidersRequest;
		}
		catch (e) {
			throw new Error("Invalid model format");
		}
	}
}
