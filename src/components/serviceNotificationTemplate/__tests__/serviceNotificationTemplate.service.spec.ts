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
import { ServiceNotificationTemplateRepositoryMock } from '../__mock__/serviceNotificationTemplate.service.mock';

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
});
