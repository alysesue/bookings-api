import { Container } from 'typescript-ioc';
import { ServiceNotificationTemplate } from '../../../models';
import { ServiceNotificationTemplateRepository } from '../serviceNotificationTemplate.repository';
import { ServiceNotificationTemplateService } from '../serviceNotificationTemplate.service';
import { ServiceNotificationTemplateRequest } from '../serviceNotificationTemplate.apicontract';
import { NotificationTemplateActionAuthVisitor } from '../serviceNotificationTemplate.auth';
import { UserContext } from '../../../infrastructure/auth/userContext';
import { UserContextMock } from '../../../infrastructure/auth/__mocks__/userContext';
import { ServicesService } from '../../services/services.service';
import { ServicesServiceMock } from '../../services/__mocks__/services.service';
import { ServiceNotificationTemplateRepositoryMock } from '../__mock__/serviceNotificationTemplate.repository.mock';

jest.mock('../ServiceNotificationTemplate.auth', () => {
	return { NotificationTemplateActionAuthVisitor: jest.fn() };
});

describe('Test the service notification template service', () => {
	const visitorMock = {
		hasPermission: jest.fn(),
	} as Partial<NotificationTemplateActionAuthVisitor>;

	beforeAll(() => {
		jest.resetAllMocks();
		Container.bind(ServiceNotificationTemplateRepository).to(ServiceNotificationTemplateRepositoryMock);
		Container.bind(ServicesService).to(ServicesServiceMock);
		Container.bind(UserContext).to(UserContextMock);
	});

	beforeEach(() => {
		jest.resetAllMocks();
		UserContextMock.getAuthGroups.mockReturnValue(Promise.resolve([]));
		(visitorMock.hasPermission as jest.Mock).mockReturnValue(true);
		(NotificationTemplateActionAuthVisitor as jest.Mock).mockImplementation(() => visitorMock);
	});

	const template = new ServiceNotificationTemplate();
	template.emailTemplateType = 2;
	template.htmlTemplate = 'testings notification template';
	template.id = 123;

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

	it('should update an email notification template', async () => {
		const updatedtemplate = new ServiceNotificationTemplate();
		updatedtemplate.emailTemplateType = 2;
		updatedtemplate.htmlTemplate = 'updated';
		updatedtemplate.id = 123;
		ServiceNotificationTemplateRepositoryMock.getTemplateMock.mockReturnValue(template);
		ServiceNotificationTemplateRepositoryMock.saveMock.mockReturnValue(template);
		const updateRequest = new ServiceNotificationTemplateRequest(2, 'updated');
		const result = await Container.get(ServiceNotificationTemplateService).updateEmailTemplate(123, updateRequest);
		expect(result).toStrictEqual(updatedtemplate);
	});

	it('should throw error when trying to verifyActionPermission with no serviceId', async () => {
		jest.resetAllMocks();
		(NotificationTemplateActionAuthVisitor as jest.Mock).mockImplementation(() => visitorMock);

		const result = async () =>
			await Container.get(ServiceNotificationTemplateService).getEmailNotificationTemplate(null, 1);
		await expect(result).rejects.toThrowErrorMatchingInlineSnapshot(
			'"User cannot perform this action (Read) for service notification template."',
		);
	});

	it('should throw error when trying to get a template with no emailTemplateType', async () => {
		const result = async () =>
			await Container.get(ServiceNotificationTemplateService).getEmailNotificationTemplate(1, null);
		await expect(result).rejects.toThrowErrorMatchingInlineSnapshot('"Invalid request"');
	});

	it('should throw error when trying to get a template that does not exist', async () => {
		const result = async () =>
			await Container.get(ServiceNotificationTemplateService).getEmailNotificationTemplate(1, 9);
		await expect(result).rejects.toThrowErrorMatchingInlineSnapshot(
			'"Template of type CancelledByServiceProviderSentToCitizen not found"',
		);
	});

	it('should throw error when trying to add a template with no request', async () => {
		const result = async () => await Container.get(ServiceNotificationTemplateService).addEmailTemplate(1, null);
		await expect(result).rejects.toThrowErrorMatchingInlineSnapshot('"Invalid request"');
	});

	it('should throw error when trying to add a template with no emailTemplateType in the request', async () => {
		const result = async () =>
			await Container.get(ServiceNotificationTemplateService).addEmailTemplate(1, {
				htmlTemplate: 'irrelevant',
				emailTemplateType: null,
			});
		await expect(result).rejects.toThrowErrorMatchingInlineSnapshot('"Invalid request"');
	});

	it('should throw error when trying to add a template that is already exists', async () => {
		ServiceNotificationTemplateRepositoryMock.getTemplateMock.mockReturnValue(template);
		const request = new ServiceNotificationTemplateRequest(2, 'irrelevant');
		const result = async () => await Container.get(ServiceNotificationTemplateService).addEmailTemplate(1, request);
		await expect(result).rejects.toThrowErrorMatchingInlineSnapshot(
			'"Template of type UpdatedByCitizenSentToCitizen already exists"',
		);
	});

	it('should throw error when trying to update a template with no emailTemplateType in the request', async () => {
		const updateRequest = new ServiceNotificationTemplateRequest(null, 'updated');
		const result = async () =>
			await Container.get(ServiceNotificationTemplateService).updateEmailTemplate(1, updateRequest);
		await expect(result).rejects.toThrowErrorMatchingInlineSnapshot('"Invalid request"');
	});

	it('should throw error when trying to update a template that is not exists', async () => {
		const updateRequest = new ServiceNotificationTemplateRequest(3, 'updated');
		const result = async () =>
			await Container.get(ServiceNotificationTemplateService).updateEmailTemplate(1, updateRequest);
		await expect(result).rejects.toThrowErrorMatchingInlineSnapshot(
			'"Template of type CancelledByCitizenSentToCitizen not found"',
		);
	});
});
