import { Inject } from 'typescript-ioc';
import { Body, Controller, Delete, Path, Post, Put, Response, Route, SuccessResponse, Tags } from 'tsoa';
import { ApiData, ApiDataFactory } from '../../apicontract';
import { OneOffTimeslotRequest, OneOffTimeslotResponse } from './oneOffTimeslots.apicontract';
import { OneOffTimeslotsService } from './oneOffTimeslots.service';
import { MOLAuth } from 'mol-lib-common';
import { OneOffTimeslotsMapper } from './oneOffTimeslots.mapper';
import { IdHasher } from '../../infrastructure/idHasher';

@Route('v1/oneOffTimeslots')
@Tags('OneOffTimeslots')
export class OneOffTimeslotsController extends Controller {
	@Inject
	private oneOffTimeslotsService: OneOffTimeslotsService;
	@Inject
	private mapper: OneOffTimeslotsMapper;
	@Inject
	private idHasher: IdHasher;

	/**
	 * Creates a one-off timeslot
	 * @param request Details of the one-off timeslot to be created.
	 */
	@Post()
	@SuccessResponse(201, 'Created')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async create(@Body() request: OneOffTimeslotRequest): Promise<ApiData<OneOffTimeslotResponse>> {
		const timeslot = await this.oneOffTimeslotsService.save(request);
		this.setStatus(201);
		return ApiDataFactory.create(this.mapper.mapDataModel(timeslot));
	}

	@Put('{id}')
	@SuccessResponse(201, 'Updated')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async update(
		@Path() id: string,
		@Body() request: OneOffTimeslotRequest,
	): Promise<ApiData<OneOffTimeslotResponse>> {
		request.idSigned = id;
		const timeslot = await this.oneOffTimeslotsService.save(request);
		this.setStatus(201);
		return ApiDataFactory.create(this.mapper.mapDataModel(timeslot));
	}
	/**
	 * Deletes a one-off timeslot
	 * @param id The ID of the one-off timeslot to be deleted.
	 */
	@Delete('{id}')
	@SuccessResponse(204, 'Deleted')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async deleteOneOffTimeslot(@Path() id: string): Promise<void> {
		const decodedId = this.idHasher.decode(id);
		await this.oneOffTimeslotsService.delete(decodedId);
	}
}
