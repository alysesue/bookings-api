import { ServicesService } from '../services.service';
import { Service } from '../../../models/entities';

export class ServicesServiceMock implements Partial<ServicesService> {
	public static getService = jest.fn();
	public static getServices = jest.fn();
	public static createServices = jest.fn();
	public static createService = jest.fn();

	public init() {}

	public async createServices(...params): Promise<Service[]> {
		return await ServicesServiceMock.createServices(...params);
	}

	public async createService(...params): Promise<Service> {
		return await ServicesServiceMock.createService(...params);
	}

	public async getServices(...params): Promise<any> {
		return await ServicesServiceMock.getServices(...params);
	}

	public async getService(...params): Promise<any> {
		return await ServicesServiceMock.getService(...params);
	}
}