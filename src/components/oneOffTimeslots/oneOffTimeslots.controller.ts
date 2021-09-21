import { Inject } from 'typescript-ioc';
import { Body, Controller, Delete, Path, Post, Put, Response, Route, SuccessResponse, Tags } from 'tsoa';
import { MOLAuth } from 'mol-lib-common';
import { ApiData, ApiDataFactory } from '../../apicontract';
import {
	OneOffTimeslotRequestV1,
	OneOffTimeslotRequestV2,
	OneOffTimeslotResponse,
} from './oneOffTimeslots.apicontract';
import { OneOffTimeslotsService } from './oneOffTimeslots.service';
import { OneOffTimeslotsMapper } from './oneOffTimeslots.mapper';
import { IdHasher } from '../../infrastructure/idHasher';

@Route('v1/oneOffTimeslots')
@Tags('OneOffTimeslots')
export class OneOffTimeslotsController extends Controller {
	@Inject
	private oneOffTimeslotsService: OneOffTimeslotsService;
	@Inject
	private oneOffTimeslotsMapper: OneOffTimeslotsMapper;

	/**
	 * Creates a one-off timeslot
	 *
	 * @param request Details of the one-off timeslot to be created.
	 */
	@Post()
	@SuccessResponse(201, 'Created')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async create(@Body() request: OneOffTimeslotRequestV1): Promise<ApiData<OneOffTimeslotResponse>> {
		const event = await this.oneOffTimeslotsService.save(request);
		this.setStatus(201);
		return ApiDataFactory.create(this.oneOffTimeslotsMapper.mapDataModel(event));
	}

	@Put('{id}')
	@SuccessResponse(201, 'Updated')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async update(
		@Path() id: string,
		@Body() request: OneOffTimeslotRequestV1,
	): Promise<ApiData<OneOffTimeslotResponse>> {
		const event = await this.oneOffTimeslotsService.update(request, id);
		this.setStatus(201);
		return ApiDataFactory.create(this.oneOffTimeslotsMapper.mapDataModel(event));
	}

	/**
	 * Deletes a one-off timeslot
	 *
	 * @param id The ID of the one-off timeslot to be deleted.
	 */
	@Delete('{id}')
	@SuccessResponse(204, 'Deleted')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async deleteOneOffTimeslot(@Path() id: string): Promise<void> {
		await this.oneOffTimeslotsService.delete(id);
	}
}

@Route('v2/oneOffTimeslots')
@Tags('OneOffTimeslots')
export class OneOffTimeslotsControllerV2 extends Controller {
	@Inject
	private oneOffTimeslotsService: OneOffTimeslotsService;
	@Inject
	private mapper: OneOffTimeslotsMapper;
	@Inject
	private idHasher: IdHasher;

	/**
	 * Creates a one-off timeslot
	 *
	 * @param request Details of the one-off timeslot to be created.
	 */
	@Post()
	@SuccessResponse(201, 'Created')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async create(@Body() request: OneOffTimeslotRequestV2): Promise<ApiData<OneOffTimeslotResponse>> {
		const unsignedServiceProviderId = this.idHasher.decode(request.serviceProviderId);
		const requestParams: OneOffTimeslotRequestV1 = { ...request, serviceProviderId: unsignedServiceProviderId };
		const timeslot = await this.oneOffTimeslotsService.save(requestParams);
		this.setStatus(201);
		return ApiDataFactory.create(this.mapper.mapDataModel(timeslot));
	}

	@Put('{id}')
	@SuccessResponse(201, 'Updated')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async update(
		@Path() id: string,
		@Body() request: OneOffTimeslotRequestV2,
	): Promise<ApiData<OneOffTimeslotResponse>> {
		const unsignedServiceProviderId = this.idHasher.decode(request.serviceProviderId);
		const requestParams: OneOffTimeslotRequestV1 = { ...request, serviceProviderId: unsignedServiceProviderId };
		const timeslot = await this.oneOffTimeslotsService.update(requestParams, id);
		this.setStatus(201);
		return ApiDataFactory.create(this.mapper.mapDataModel(timeslot));
	}
}
