import { LabelResponseModel } from '../labels/label.apicontract';
import { OneOffTimeslot } from '../../models';
import { PagingRequest } from '../../apicontract';
import { ServiceSummaryModel } from '../services/service.apicontract';
import { ServiceProviderSummaryModelV2 } from '../serviceProviders/serviceProviders.apicontract';

export interface IEventTimeslot {
	/**
	 * Start time of this timeslot
	 */
	startDateTime: Date;
	/**
	 * End time of this timeslot
	 */
	endDateTime: Date;
	/**
	 * @isInt
	 */
	serviceProviderId: string;
}

export class EventTimeslotRequest implements IEventTimeslot {
	public id?: string;
	public startDateTime: Date;
	public endDateTime: Date;
	public serviceProviderId: string;
}

export class EventTimeslotResponse {
	public id: string;
	public startDateTime: Date;
	public endDateTime: Date;
	public serviceProvider: ServiceProviderSummaryModelV2;
}

export interface IEventRequest {
	id?: string;
	serviceId: string;
	title?: string;
	description?: string;
	capacity?: number;
	labelIds?: string[];
}

export class EventRequest implements IEventRequest {
	public id?: string;
	public serviceId: string;
	public title?: string;
	public description?: string;
	public capacity?: number;
	public labelIds?: string[];
	public timeslots: EventTimeslotRequest[];
}

export class EventOneOffTimeslotRequest implements IEventRequest {
	public id?: string;
	public serviceId: string;
	public title?: string;
	public description?: string;
	public capacity?: number;
	public labelIds?: string[];
	public timeslot: OneOffTimeslot;
}

export type EventFilter = {
	serviceId: number;
} & PagingRequest;

export type EventResponse = {
	id: string;
	service: ServiceSummaryModel;
	title?: string;
	description?: string;
	capacity?: number;
	labels?: LabelResponseModel[];
	firstStartDateTime: Date;
	lastEndDateTime: Date;
	timeslots: EventTimeslotResponse[];
};
