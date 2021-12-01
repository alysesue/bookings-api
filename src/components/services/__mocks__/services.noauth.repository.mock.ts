import { Service } from '../../../models';
import { ServicesRepositoryNoAuth } from '../services.noauth.repository';

export class ServicesRepositoryNoAuthMock implements Partial<ServicesRepositoryNoAuth> {
	public static getServicesForUserGroups = jest.fn<Promise<Service[]>, any>();

	public async getServicesForUserGroups(...params): Promise<any> {
		return await ServicesRepositoryNoAuthMock.getServicesForUserGroups(...params);
	}
}
