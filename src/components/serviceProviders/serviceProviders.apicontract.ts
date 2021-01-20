import { TimeslotsScheduleResponse } from '../timeslotItems/timeslotItems.apicontract';
import { ScheduleFormResponse } from '../scheduleForms/scheduleForms.apicontract';

export class ServiceProviderModel {
	public name: string;
	public email?: string;
	public phone?: string;
	public expiryDate?: Date;

	constructor(name: string, email?: string, phone?: string, expiryDate?: Date) {
		this.name = name;
		this.email = email;
		this.phone = phone;
		this.expiryDate = expiryDate;
	}
}

export type MolServiceProviderOnboardContract = {
	name: string;
	email?: string;
	phoneNumber: string;
	agencyUserId?: string;
	uinfin?: string;
	serviceName: string;
	autoAcceptBookings?: boolean;
};

export type MolServiceProviderWithGroups = MolServiceProviderOnboardContract & {
	groups: string[];
};

export type MolServiceProviderOnboard = MolServiceProviderWithGroups & {
	username: string;
	molAdminId: string;
};

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
	public expiryDate?: Date;
	public scheduleFormConfirmed: boolean;
	public onHoldEnabled?: boolean;
}

export class ServiceProviderListRequest {
	public serviceProviders: ServiceProviderModel[];
}

export class TotalServiceProviderResponse {
	public total: number;
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
