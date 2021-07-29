import { ServiceNotificationTemplateRepository } from '../serviceNotificationTemplate.repository';

export class ServiceNotificationTemplateRepositoryMock implements Partial<ServiceNotificationTemplateRepository> {
	public static saveTemplateMock = jest.fn();
	public static getTemplateMock = jest.fn();

	public async save() {
		return ServiceNotificationTemplateRepositoryMock.saveTemplateMock();
	}

	public async getServiceTemplate() {
		return ServiceNotificationTemplateRepositoryMock.getTemplateMock();
	}
}
