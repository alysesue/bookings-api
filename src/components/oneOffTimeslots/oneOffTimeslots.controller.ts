import { Inject } from 'typescript-ioc';
import { Body, Controller, Post, Response, Route, SuccessResponse, Tags } from 'tsoa';
import { ApiData, ApiDataFactory } from '../../apicontract';
import { OneOffTimeslotRequest, OneOffTimeslotResponse } from './oneOffTimeslots.apicontract';
import { OneOffTimeslotsService } from './oneOffTimeslots.service';
import { OneOffTimeslot } from '../../models';
import { MOLAuth } from 'mol-lib-common';
import { IdHasher } from '../../infrastructure/idHasher';
import { LabelsMapper } from '../../components/labels/labels.mapper';
@Route('v1/oneOffTimeslots')
@Tags('OneOffTimeslots')
export class OneOffTimeslotsController extends Controller {
	@Inject
	private oneOffTimeslotsService: OneOffTimeslotsService;
	@Inject
	private idHasher: IdHasher;
	@Inject
	private labelMapper: LabelsMapper;

	private mapDataModel(timeslot: OneOffTimeslot): OneOffTimeslotResponse {
		const response = new OneOffTimeslotResponse();
		response.idSigned = this.idHasher.encode(timeslot.id);
		response.startDateTime = timeslot.startDateTime;
		response.endDateTime = timeslot.endDateTime;
		response.capacity = timeslot.capacity;
		response.labels = this.labelMapper.mapToLabelsResponse(timeslot.labels);
		return response;
	}

	@Post()
	@SuccessResponse(201, 'Created')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async create(@Body() request: OneOffTimeslotRequest): Promise<ApiData<OneOffTimeslotResponse>> {
		const timeslot = await this.oneOffTimeslotsService.save(request);
		this.setStatus(201);
		return ApiDataFactory.create(this.mapDataModel(timeslot));
	}
}
