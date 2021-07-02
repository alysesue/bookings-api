import { Service } from '../../../models';
import { ServicesRepository } from '../services.repository';

export class ServicesRepositoryMock implements Partial<ServicesRepository> {
	public static save = jest.fn<Promise<Service>, any>();
	public static getService = jest.fn();
	public static get = jest.fn();
	public static getAll = jest.fn();
	public static getServicesByName = jest.fn();
	public static getServiceWithTimeslotsSchedule = jest.fn<Promise<Service>, any>();
	public static saveMany = jest.fn();

	public async getServicesByName(...params): Promise<Service[]> {
		return ServicesRepositoryMock.getServicesByName(...params);
	}

	public async getServiceWithTimeslotsSchedule(...params): Promise<Service> {
		return ServicesRepositoryMock.getServiceWithTimeslotsSchedule(...params);
	}

	public async save(...params): Promise<Service> {
		return ServicesRepositoryMock.save(...params);
	}

	public async get(...params): Promise<Service> {
		return ServicesRepositoryMock.get(...params);
	}

	public async getAll(...params): Promise<Service[]> {
		return ServicesRepositoryMock.getAll(...params);
	}

	public async getService(...params): Promise<Service> {
		return ServicesRepositoryMock.getService(...params);
	}

	public async saveMany(...params): Promise<Service[]> {
		return ServicesRepositoryMock.saveMany(...params);
	}
}
