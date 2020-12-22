import { TimeslotsScheduleResponse } from '../timeslotItems/timeslotItems.apicontract';
import { ScheduleFormResponse } from '../scheduleForms/scheduleForms.apicontract';

export class ServiceProviderModel {
	public name: string;
	public email?: string;
	public phone?: string;

	constructor(name: string, email?: string, phone?: string) {
		this.name = name;
		this.email = email;
		this.phone = phone;
	}
}

export interface MolServiceProviderOnboard {
	username?: string;
	name: string;
	email: string;
	phoneNumber: string;
	agencyUserId?: string;
	uinfin?: string;
	molAdminId?: string;
	groups?: string[];

	serviceName: string;
	autoAcceptBookings?: boolean;
}

export type MolServiceProviderOnboardContract = Pick<
	MolServiceProviderOnboard,
	// tslint:disable-next-line:max-union-size
	'name' | 'email' | 'phoneNumber' | 'agencyUserId' | 'uinfin' | 'serviceName' | 'autoAcceptBookings'
>;

export class ServiceProviderResponseModel {
	/**
	 * @isInt
	 */
	public id: number;
	public name: string;
	/**
	 * @isInt
	 */
	public serviceId: number;
	public timeslotsSchedule?: TimeslotsScheduleResponse;
	public scheduleForm?: ScheduleFormResponse;
	public email?: string;
	public phone?: string;
	public agencyUserId?: string;
	public scheduleFormConfirmed: boolean;
}

export class ServiceProviderListRequest {
	public serviceProviders: ServiceProviderModel[];
}

export class ServiceProviderSummaryModel {
	/**
	 * @isInt
	 */
	public id: number;
	public name: string;

	constructor(id: number, name: string) {
		this.id = id;
		this.name = name;
	}
}
