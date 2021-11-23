import { TimeslotsScheduleResponseV1, TimeslotsScheduleResponseV2 } from '../timeslotItems/timeslotItems.apicontract';
import { ScheduleFormResponseV1, ScheduleFormResponseV2 } from '../scheduleForms/scheduleForms.apicontract';
import { PagingRequest } from '../../apicontract';
import { ServiceProviderLabelResponseModel } from '../serviceProvidersLabels/serviceProvidersLabels.apicontract';

export class ServiceProviderModel {
	public name: string;
	public email?: string | null;
	public phone?: string | null;
	public expiryDate?: Date | null;
	public description?: string | null;
	public aliasName?: string | null;
	public labelIds?: string[];

	constructor(
		name: string,
		email?: string,
		phone?: string,
		expiryDate?: Date,
		description?: string,
		aliasName?: string,
		labelIds?: string[],
	) {
		this.name = name;
		this.email = email;
		this.phone = phone;
		this.expiryDate = expiryDate;
		this.description = description;
		this.aliasName = aliasName;
		this.labelIds = labelIds;
	}
}

export class MolServiceProviderOnboardContract {
	public name: string;
	public email?: string;
	public phoneNumber?: string;
	public agencyUserId?: string;
	public uinfin?: string;
	public serviceName: string;
	public autoAcceptBookings?: boolean;
}

export class MolServiceProviderWithGroups extends MolServiceProviderOnboardContract {
	public groups: string[];
}

export class MolServiceProviderOnboard extends MolServiceProviderWithGroups {
	public username: string;
	public molAdminId: string;
}

export class ServiceProviderResponseModelBase {
	public name: string;
	public email?: string;
	public phone?: string;
	public agencyUserId?: string;
	public expiryDate?: Date;
	public scheduleFormConfirmed: boolean;
	public onHoldEnabled?: boolean;
	public description?: string;
	public aliasName?: string;
	public autoAcceptBookings?: boolean;
}

export class ServiceProviderResponseModelV1 extends ServiceProviderResponseModelBase {
	/**
	 * @isInt
	 */
	public id: number;
	/**
	 * @isInt
	 */
	public serviceId: number;
	public timeslotsSchedule?: TimeslotsScheduleResponseV1;
	public scheduleForm?: ScheduleFormResponseV1;
}

export class ServiceProviderResponseModelV2 extends ServiceProviderResponseModelBase {
	public id: string;
	public serviceId: string;
	public timeslotsSchedule?: TimeslotsScheduleResponseV2;
	public scheduleForm?: ScheduleFormResponseV2;
	public labels?: ServiceProviderLabelResponseModel[];
}

export class ServiceProviderListRequest {
	public serviceProviders: ServiceProviderModel[];
}

export class TotalServiceProviderResponse {
	public total: number;
}

export class ServiceProviderSummaryModelBase {
	public name: string;
}

export class ServiceProviderSummaryModelV1 extends ServiceProviderSummaryModelBase {
	/**
	 * @isInt
	 */
	public id: number;

	constructor(id: number, name: string) {
		super();
		this.id = id;
		this.name = name;
	}
}

export class ServiceProviderSummaryModelV2 extends ServiceProviderSummaryModelBase {
	public id: string;

	constructor(id: string, name: string) {
		super();
		this.id = id;
		this.name = name;
	}
}

export class ServiceProviderSearchRequest extends PagingRequest {
	public from?: Date;
	public to?: Date;
	public serviceId?: number;
}
