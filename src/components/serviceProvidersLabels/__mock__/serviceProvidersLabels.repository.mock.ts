import { ServiceProviderLabel, ServiceProviderLabelCategory } from '../../../models';
import {
	ServiceProviderLabelsCategoriesRepository,
	ServiceProviderLabelsRepository,
} from '../serviceProvidersLabels.repository';

export class ServiceProviderLabelsRepositoryMock implements Partial<ServiceProviderLabelsRepository> {
	public static findMock = jest.fn();
	public static deleteMock = jest.fn();
	public static saveMock = jest.fn();

	public async delete(...params) {
		return ServiceProviderLabelsRepositoryMock.deleteMock(...params);
	}

	public async save(...params): Promise<ServiceProviderLabel[]> {
		return ServiceProviderLabelsRepositoryMock.saveMock(...params);
	}

	public async find(...params): Promise<ServiceProviderLabel[]> {
		return ServiceProviderLabelsRepositoryMock.findMock(...params);
	}
}

export class ServiceProviderLabelsCategoriesRepositoryMock
	implements Partial<ServiceProviderLabelsCategoriesRepository> {
	public static deleteMock = jest.fn();
	public static saveMock = jest.fn();
	public static findMock = jest.fn();

	public async delete(...params) {
		return ServiceProviderLabelsCategoriesRepositoryMock.deleteMock(...params);
	}

	public async save(...params): Promise<ServiceProviderLabelCategory[]> {
		return ServiceProviderLabelsCategoriesRepositoryMock.saveMock(...params);
	}

	public async find(...params): Promise<ServiceProviderLabelCategory[]> {
		return ServiceProviderLabelsCategoriesRepositoryMock.findMock(...params);
	}
}
