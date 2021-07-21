import { Container } from 'typescript-ioc';
import { ServiceNotificationTemplate } from '../../../models';
import { ServiceNotificationTemplateRepository } from '../serviceNotificationTemplate.repository';
import { ServiceNotificationTemplateService } from '../serviceNotificationTemplate.service';
import {
	ServiceNotificationTemplateRequest,
	ServiceNotificationTemplateResponse,
} from '../serviceNotificationTemplate.apicontract';
import { NotificationTemplateActionAuthVisitor } from '../serviceNotificationTemplate.auth';
import { UserContext } from '../../../infrastructure/auth/userContext';
import { UserContextMock } from '../../../infrastructure/auth/__mocks__/userContext';
import { ServicesService } from '../../services/services.service';
import { ServicesServiceMock } from '../../services/__mocks__/services.service';
import { ServiceNotificationTemplateRepositoryMock } from '../__mock__/serviceNotificationTemplate.repository.mock';
import { EmailNotificationTemplateType } from '../../../enums/notifications';
import { defaultTemplates } from '../../notifications/templates/defaultNotificationTemplate';

jest.mock('../ServiceNotificationTemplate.auth', () => {
	return { NotificationTemplateActionAuthVisitor: jest.fn() };
});

describe('Services Notification Template service test', () => {
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

	const serviceId = 1;
	const templateType = 2;

	const template = new ServiceNotificationTemplate();
	template.emailTemplateType = templateType;
	template.htmlTemplate = 'testings notification template';
	template.id = 123;

	const defaultTemplate = new ServiceNotificationTemplateResponse();
	defaultTemplate.emailTemplateType = 9;
	defaultTemplate.htmlTemplate =
		defaultTemplates.email[EmailNotificationTemplateType[defaultTemplate.emailTemplateType].toString()];
	defaultTemplate.serviceId = serviceId;
	defaultTemplate.id = null;
	defaultTemplate.isDefaultTemplate = true;

	it('should get an email notification template response', async () => {
		const expectedResponse = new ServiceNotificationTemplateResponse();
		expectedResponse.id = 123;
		expectedResponse.serviceId = serviceId;
		expectedResponse.emailTemplateType = template.emailTemplateType;
		expectedResponse.htmlTemplate = template.htmlTemplate;
		expectedResponse.isDefaultTemplate = false;
		ServiceNotificationTemplateRepositoryMock.getTemplateMock.mockReturnValue(template);
		const result = await Container.get(ServiceNotificationTemplateService).getEmailNotificationTemplateByType(
			serviceId,
			templateType,
		);

		expect(result).toStrictEqual(expectedResponse);
	});

	it('should add an email notification template', async () => {
		const request = new ServiceNotificationTemplateRequest(templateType, 'irrelevant');
		ServiceNotificationTemplateRepositoryMock.saveTemplateMock.mockReturnValue(template);
		const result = await Container.get(
			ServiceNotificationTemplateService,
		).addEmailServiceNotificationTemplateByType(serviceId, request);

		expect(result).toStrictEqual(template);
	});

	it('should update an email notification template', async () => {
		const updatedtemplate = new ServiceNotificationTemplate();
		updatedtemplate.emailTemplateType = templateType;
		updatedtemplate.htmlTemplate = 'updated';
		updatedtemplate.id = 123;
		ServiceNotificationTemplateRepositoryMock.getTemplateMock.mockReturnValue(template);
		ServiceNotificationTemplateRepositoryMock.saveTemplateMock.mockReturnValue(template);
		const updateRequest = new ServiceNotificationTemplateRequest(templateType, 'updated');
		const result = await Container.get(
			ServiceNotificationTemplateService,
		).updateEmailServiceNotificationTemplateByType(serviceId, updateRequest);
		expect(result).toStrictEqual(updatedtemplate);
	});

	it('should throw error when user has no verifyActionPermission', async () => {
		jest.resetAllMocks();
		(NotificationTemplateActionAuthVisitor as jest.Mock).mockImplementation(() => visitorMock);

		const result = async () =>
			await Container.get(ServiceNotificationTemplateService).addEmailServiceNotificationTemplateByType(
				serviceId,
				template,
			);
		await expect(result).rejects.toThrowErrorMatchingInlineSnapshot(
			'"User cannot perform this action (Create) for service notification template."',
		);
	});

	it('should throw error when trying to get a template with no emailTemplateType', async () => {
		const result = async () =>
			await Container.get(ServiceNotificationTemplateService).getEmailNotificationTemplateByType(serviceId, null);
		await expect(result).rejects.toThrowErrorMatchingInlineSnapshot('"Invalid request"');
	});

	it('should return default template in get request when service template does not exist', async () => {
		const result = await Container.get(ServiceNotificationTemplateService).getEmailNotificationTemplateByType(
			serviceId,
			9,
		);
		await expect(result).toStrictEqual(defaultTemplate);
	});

	it('should throw error when trying to add a template with no request', async () => {
		const result = async () =>
			await Container.get(ServiceNotificationTemplateService).addEmailServiceNotificationTemplateByType(
				serviceId,
				null,
			);
		await expect(result).rejects.toThrowErrorMatchingInlineSnapshot('"Invalid request"');
	});

	it('should throw error when trying to add a template with no emailTemplateType in the request', async () => {
		const result = async () =>
			await Container.get(ServiceNotificationTemplateService).addEmailServiceNotificationTemplateByType(
				serviceId,
				{
					htmlTemplate: 'irrelevant',
					emailTemplateType: null,
				},
			);
		await expect(result).rejects.toThrowErrorMatchingInlineSnapshot('"Invalid request"');
	});

	it('should throw error when trying to add a template that is already exists', async () => {
		ServiceNotificationTemplateRepositoryMock.getTemplateMock.mockReturnValue(template);
		const request = new ServiceNotificationTemplateRequest(templateType, 'irrelevant');
		const result = async () =>
			await Container.get(ServiceNotificationTemplateService).addEmailServiceNotificationTemplateByType(
				serviceId,
				request,
			);
		await expect(result).rejects.toThrowErrorMatchingInlineSnapshot(
			'"Template of type UpdatedByCitizenSentToCitizen already exists"',
		);
	});

	it('should throw error when trying to update a template with no emailTemplateType in the request', async () => {
		const updateRequest = new ServiceNotificationTemplateRequest(null, 'updated');
		const result = async () =>
			await Container.get(ServiceNotificationTemplateService).updateEmailServiceNotificationTemplateByType(
				serviceId,
				updateRequest,
			);
		await expect(result).rejects.toThrowErrorMatchingInlineSnapshot('"Invalid request"');
	});

	it('should throw error when trying to update a template that is not exists', async () => {
		const updateRequest = new ServiceNotificationTemplateRequest(3, 'updated');
		const result = async () =>
			await Container.get(ServiceNotificationTemplateService).updateEmailServiceNotificationTemplateByType(
				serviceId,
				updateRequest,
			);
		await expect(result).rejects.toThrowErrorMatchingInlineSnapshot(
			'"Template of type CancelledByCitizenSentToCitizen not found"',
		);
	});
});
