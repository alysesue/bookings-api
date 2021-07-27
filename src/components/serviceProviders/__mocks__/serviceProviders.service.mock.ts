import { ServiceProvidersService } from '../serviceProviders.service';
import { ScheduleForm, ServiceProvider, TimeslotItem, TimeslotsSchedule } from '../../../models/entities';
import { MolServiceProviderOnboardContract, ServiceProviderModel } from '../serviceProviders.apicontract';
import { MolUpsertUsersResult } from '../../users/molUsers/molUsers.apicontract';
import { TimeslotItemRequest } from '../../timeslotItems/timeslotItems.apicontract';

export class ServiceProvidersServiceMock implements Partial<ServiceProvidersService> {
	public static getServiceProviderMock = jest.fn();
	public static getServiceProvidersCountMock = jest.fn();
	public static getServiceProvidersMock = jest.fn();
	public static getAvailableServiceProvidersMock = jest.fn<Promise<ServiceProvider[]>, any>();
	public static updateServiceProviderMock = jest.fn();
	public static saveMock = jest.fn();
	public static setProviderScheduleFormMock = jest.fn();
	public static getProviderScheduleFormMock = jest.fn();
	public static getTimeslotItemsByServiceProviderIdMock = jest.fn();
	public static createTimeslotItemForServiceProviderMock = jest.fn();
	public static updateTimeslotItemForServiceProviderMock = jest.fn();
	public static deleteTimeslotForServiceProviderMock = jest.fn();
	public static createServiceProvidersMock = jest.fn();
	public static getServiceProvidersByNameMock = jest.fn();
	public static getFilteredServiceProvidersByEmailMock = jest.fn();

	public async getServiceProvider(...params): Promise<ServiceProvider> {
		return ServiceProvidersServiceMock.getServiceProviderMock(...params);
	}
	public async createServiceProviders(
		serviceProviderOnboardContracts: MolServiceProviderOnboardContract[],
	): Promise<MolUpsertUsersResult> {
		return ServiceProvidersServiceMock.createServiceProvidersMock(serviceProviderOnboardContracts);
	}
	public async getServiceProvidersCount(): Promise<number> {
		return ServiceProvidersServiceMock.getServiceProvidersCountMock();
	}
	public async getServiceProvidersByName(): Promise<ServiceProvider[]> {
		return ServiceProvidersServiceMock.getServiceProvidersByNameMock();
	}
	public async getServiceProviders(): Promise<ServiceProvider[]> {
		return ServiceProvidersServiceMock.getServiceProvidersMock();
	}
	public async getAvailableServiceProviders(...params): Promise<any> {
		return await ServiceProvidersServiceMock.getAvailableServiceProvidersMock(...params);
	}

	public async saveServiceProviders(listRequest: ServiceProviderModel[]): Promise<void> {
		return ServiceProvidersServiceMock.saveMock(listRequest);
	}
	public async updateSp(request: ServiceProviderModel, spId: number): Promise<ServiceProvider> {
		return ServiceProvidersServiceMock.updateServiceProviderMock(request, spId);
	}
	public async setProviderScheduleForm(...params): Promise<ScheduleForm> {
		return ServiceProvidersServiceMock.setProviderScheduleFormMock(...params);
	}

	public async getProviderScheduleForm(...params): Promise<ScheduleForm> {
		return ServiceProvidersServiceMock.getProviderScheduleFormMock(...params);
	}

	public async getTimeslotItems(serviceProviderId: number): Promise<TimeslotsSchedule> {
		return ServiceProvidersServiceMock.getTimeslotItemsByServiceProviderIdMock(serviceProviderId);
	}

	public async addTimeslotItem(
		serviceProviderId: number,
		timeslotsSchedule: TimeslotItemRequest,
	): Promise<TimeslotItem> {
		return ServiceProvidersServiceMock.createTimeslotItemForServiceProviderMock(
			serviceProviderId,
			timeslotsSchedule,
		);
	}

	public async updateTimeslotItem(serviceProviderId, timeslotId, request): Promise<TimeslotItem> {
		return ServiceProvidersServiceMock.updateTimeslotItemForServiceProviderMock(
			serviceProviderId,
			timeslotId,
			request,
		);
	}

	public async deleteTimeslotItem(serviceProviderId: number, timeslotsScheduleId: number): Promise<void> {
		return ServiceProvidersServiceMock.deleteTimeslotForServiceProviderMock(serviceProviderId, timeslotsScheduleId);
	}

	public getFilteredServiceProvidersByEmail(...params): ServiceProvider[] {
		return ServiceProvidersServiceMock.getFilteredServiceProvidersByEmailMock(...params);
	}
}
