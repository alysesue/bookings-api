import { ServiceProvider } from '../../../models/entities';
import { ServiceProvidersRepository } from '../serviceProviders.repository';

export class ServiceProvidersRepositoryMock implements Partial<ServiceProvidersRepository> {
	public static sp: ServiceProvider;
	public static getServiceProviders = jest.fn();
	public static getServiceProviderMock: ServiceProvider;
	public static getServiceProvidersCountMock: number;
	public static getServiceProvidersByName = jest.fn();
	public static save = jest.fn();
	public static saveMany = jest.fn();

	public async getServiceProviders(...params): Promise<ServiceProvider[]> {
		return await ServiceProvidersRepositoryMock.getServiceProviders(...params);
	}

	public async getServiceProvider(): Promise<ServiceProvider> {
		return Promise.resolve(ServiceProvidersRepositoryMock.getServiceProviderMock);
	}

	public async getServiceProvidersCount(): Promise<number> {
		return Promise.resolve(ServiceProvidersRepositoryMock.getServiceProvidersCountMock);
	}

	public async getServiceProvidersByName(...params): Promise<ServiceProvider[]> {
		return await ServiceProvidersRepositoryMock.getServiceProvidersByName(...params);
	}

	public async save(...params): Promise<ServiceProvider> {
		return await ServiceProvidersRepositoryMock.save(...params);
	}

	public async saveMany(...params): Promise<ServiceProvider[]> {
		return await ServiceProvidersRepositoryMock.saveMany(...params);
	}
}
