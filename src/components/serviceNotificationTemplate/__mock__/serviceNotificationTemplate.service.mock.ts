import { ServiceNotificationTemplateRepository } from '../serviceNotificationTemplate.repository';

export class ServiceNotificationTemplateRepositoryMock implements Partial<ServiceNotificationTemplateRepository> {
	public static saveMock = jest.fn();
	public static getTemplateMock = jest.fn();

	public async save() {
		return ServiceNotificationTemplateRepositoryMock.saveMock();
	}

	public async getTemplateByType() {
		return ServiceNotificationTemplateRepositoryMock.getTemplateMock();
	}
}
