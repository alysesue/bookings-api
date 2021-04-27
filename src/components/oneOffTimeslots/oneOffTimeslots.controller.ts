import { Inject } from 'typescript-ioc';
import { Body, Controller, Path, Post, Put, Response, Route, SuccessResponse, Tags } from 'tsoa';
import { ApiData, ApiDataFactory } from '../../apicontract';
import { OneOffTimeslotRequest, OneOffTimeslotResponse } from './oneOffTimeslots.apicontract';
import { OneOffTimeslotsService } from './oneOffTimeslots.service';
import { MOLAuth } from 'mol-lib-common';
import { OneOffTimeslotsMapper } from './oneOffTimeslots.mapper';

@Route('v1/oneOffTimeslots')
@Tags('OneOffTimeslots')
export class OneOffTimeslotsController extends Controller {
	@Inject
	private oneOffTimeslotsService: OneOffTimeslotsService;
	@Inject
	private mapper: OneOffTimeslotsMapper;

	@Post()
	@SuccessResponse(201, 'Created')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async create(@Body() request: OneOffTimeslotRequest): Promise<ApiData<OneOffTimeslotResponse>> {
		const timeslot = await this.oneOffTimeslotsService.save(request);
		this.setStatus(201);
		return ApiDataFactory.create(this.mapper.mapDataModel(timeslot));
	}

	@Put('{idSigned}')
	@SuccessResponse(201, 'Updated')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async update(
		@Path() idSigned: string,
		@Body() request: OneOffTimeslotRequest,
	): Promise<ApiData<OneOffTimeslotResponse>> {
		request.idSigned = idSigned;
		const timeslot = await this.oneOffTimeslotsService.save(request);
		this.setStatus(201);
		return ApiDataFactory.create(this.mapper.mapDataModel(timeslot));
	}
}
