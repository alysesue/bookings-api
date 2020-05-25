import { Inject } from "typescript-ioc";
import {
	ServiceProviderListRequest,
	ServiceProviderModel
} from "./serviceProviders.apicontract";
import { ServiceProvidersService } from "./serviceProviders.service";
import { ServiceProvider } from "../models";
import { Body, Controller, Get, Path, Post, Put, Query, Route, SuccessResponse, Tags } from "tsoa";

@Route("api/v1/serviceProviders")
@Tags('Service Providers')
export class ServiceProvidersController extends Controller {
	@Inject
	private serviceProvidersService: ServiceProvidersService;

	@Post("")
	public async addSP(@Body() spRequest: ServiceProviderListRequest): Promise<any> {
		return await this.serviceProvidersService.save(spRequest.serviceProviders);
	}

	@Get("")
	public async getCalendars(): Promise<ServiceProviderModel[]> {
		const dataModels = await this.serviceProvidersService.getServiceProviders();
		return this.mapDataModels(dataModels);
	}

	@Get("{spId}")
	public async addUser(@Path() spId: string): Promise<ServiceProviderModel> {
		const dataModel = await this.serviceProvidersService.getServiceProvider(spId);
		return this.mapDataModel(dataModel);
	}

	private mapDataModel(spData: ServiceProvider): ServiceProviderModel {
		return {
			id: spData.id,
			name: spData.name
		} as ServiceProviderModel;
	}

	private mapDataModels(spList: ServiceProvider[]): ServiceProviderModel[] {
		return spList?.map(e => this.mapDataModel(e));
	}
}
