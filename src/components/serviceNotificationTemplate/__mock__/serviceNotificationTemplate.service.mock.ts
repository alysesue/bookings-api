import { ServiceNotificationTemplateService } from '../serviceNotificationTemplate.service';
import { ServiceNotificationTemplate } from '../../../models';

export class ServiceNotificationTemplateServiceMock implements Partial<ServiceNotificationTemplateService> {
	public static getEmailMock = jest.fn();
	public static addEmailMock = jest.fn();
	public static updateEmailMock = jest.fn();
	public static getNotificationTemplateMock = jest.fn();

	public async getEmailNotificationTemplateByType(): Promise<ServiceNotificationTemplate> {
		return ServiceNotificationTemplateServiceMock.getEmailMock();
	}

	public async addEmailServiceNotificationTemplateByType(): Promise<ServiceNotificationTemplate> {
		return ServiceNotificationTemplateServiceMock.addEmailMock();
	}

	public async updateEmailServiceNotificationTemplateByType(): Promise<ServiceNotificationTemplate> {
		return ServiceNotificationTemplateServiceMock.updateEmailMock();
	}

	public async getEmailServiceNotificationTemplateByType(): Promise<ServiceNotificationTemplate> {
		return ServiceNotificationTemplateServiceMock.getNotificationTemplateMock();
	}
}
