import { ServiceProvider } from '../../../models';
import { ServiceProvidersRepositoryNoAuth } from '../serviceProviders.noauth.repository';

export class ServiceProvidersRepositoryNoAuthMock implements Partial<ServiceProvidersRepositoryNoAuth> {
	public static getServiceProviderByMolAdminId = jest.fn<Promise<ServiceProvider>, any>();

	public async getServiceProviderByMolAdminId(...params): Promise<any> {
		return await ServiceProvidersRepositoryNoAuthMock.getServiceProviderByMolAdminId(...params);
	}
}
