import { ServiceNotificationTemplateService } from '../serviceNotificationTemplate.service';
import { ServiceNotificationTemplate } from '../../../models';

export class ServiceNotificationTemplateServiceMock implements Partial<ServiceNotificationTemplateService> {
	public static getEmailNotificationTemplate = jest.fn();
	public static addEmailTemplate = jest.fn();
	public static updateEmailTemplate = jest.fn();

	public async getEmailNotificationTemplate(): Promise<ServiceNotificationTemplate> {
		return ServiceNotificationTemplateServiceMock.getEmailNotificationTemplate();
	}

	public async addEmailTemplate(): Promise<ServiceNotificationTemplate> {
		return ServiceNotificationTemplateServiceMock.addEmailTemplate();
	}

	public async updateEmailTemplate(): Promise<ServiceNotificationTemplate> {
		return ServiceNotificationTemplateServiceMock.updateEmailTemplate();
	}
}
