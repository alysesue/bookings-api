import { Container } from 'typescript-ioc';
import { ServiceNotificationTemplate } from '../../../models';
import { ServiceNotificationTemplateRepository } from '../serviceNotificationTemplate.repository';
import { ServiceNotificationTemplateService } from '../serviceNotificationTemplate.service';
import { ServiceNotificationTemplateRequest } from '../serviceNotificationTemplate.apicontract';

describe('Test the service notification template service', () => {
	beforeAll(() => {
		jest.resetAllMocks();
		Container.bind(ServiceNotificationTemplateRepository).to(ServiceNotificationTemplateRepositoryMock);
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	const template = new ServiceNotificationTemplate();
	template.emailTemplateType = 2;
	template.htmlTemplate = 'testings notification template';
	template.id = 123;
	template.serviceId = 1;

	it('should get an email notification template', async () => {
		ServiceNotificationTemplateRepositoryMock.getTemplateMock.mockReturnValue(template);
		const result = await Container.get(ServiceNotificationTemplateService).getEmailNotificationTemplate(1, 2);

		expect(result).toStrictEqual(template);
	});

	it('should add an email notification template', async () => {
		const request = new ServiceNotificationTemplateRequest(4, 'irrelevant');
		ServiceNotificationTemplateRepositoryMock.saveMock.mockReturnValue(template);
		const result = await Container.get(ServiceNotificationTemplateService).addEmailTemplate(1, request);

		expect(result).toStrictEqual(template);
	});
});

class ServiceNotificationTemplateRepositoryMock implements Partial<ServiceNotificationTemplateRepository> {
	public static saveMock = jest.fn();
	public static getTemplateMock = jest.fn();

	public async save() {
		return ServiceNotificationTemplateRepositoryMock.saveMock();
	}

	public async getTemplate() {
		return ServiceNotificationTemplateRepositoryMock.getTemplateMock();
	}
}
