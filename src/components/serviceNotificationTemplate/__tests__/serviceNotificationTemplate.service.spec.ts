import { Container } from 'typescript-ioc';
import { IdHasher } from '../../../infrastructure/idHasher';
import { ServiceNotificationTemplate } from '../../../models';
import { ServiceNotificationTemplateRepository } from '../serviceNotificationTemplate.repository';
import { IdHasherMock } from '../../../infrastructure/__mocks__/idHasher.mock';
import { ServiceNotificationTemplateService } from '../serviceNotificationTemplate.service';
import { ServiceNotificationTemplateRequest } from '../serviceNotificationTemplate.apicontract';

describe('Test the service notification template service', () => {
	beforeAll(() => {
		jest.resetAllMocks();
		Container.bind(ServiceNotificationTemplateRepository).to(ServiceNotificationTemplateRepositoryMock);
		Container.bind(IdHasher).to(IdHasherMock);
	});

	beforeEach(() => {
		jest.resetAllMocks();

		IdHasherMock.encode.mockImplementation((value: number) => value.toString());
		IdHasherMock.decode.mockImplementation((value: string) => Number.parseInt(value, 10));
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
