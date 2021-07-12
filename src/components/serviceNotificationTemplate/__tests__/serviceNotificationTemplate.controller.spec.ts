import { Container } from 'typescript-ioc';
import { ServicesNotificationTemplateController } from '../serviceNotificationTemplate.controller';
import { ServiceNotificationTemplateService } from '../serviceNotificationTemplate.service';
import {
	ServiceNotificationTemplateRequest,
	ServiceNotificationTemplateResponse,
} from '../serviceNotificationTemplate.apicontract';
import { ServiceNotificationTemplateServiceMock } from '../__mock__/serviceNotificationTemplate.service.mock';

describe('Services controller tests', () => {
	beforeAll(() => {
		Container.bind(ServiceNotificationTemplateService).to(ServiceNotificationTemplateServiceMock);
	});

	const mockItem = new ServiceNotificationTemplateResponse();
	mockItem.id = 123;
	mockItem.htmlTemplate = 'get template';
	mockItem.emailTemplateType = 2;
	mockItem.serviceId = 1;

	it('should get an email notification template', async () => {
		ServiceNotificationTemplateServiceMock.getEmailNotificationTemplate.mockReturnValue(mockItem);
		const response = await Container.get(
			ServicesNotificationTemplateController,
		).getEmailNotificationTemplateByServiceId(1, 2);
		expect(response.data).toEqual(mockItem);
	});

	it('should create an email notification template', async () => {
		ServiceNotificationTemplateServiceMock.addEmailTemplate.mockReturnValue(mockItem);
		const request = new ServiceNotificationTemplateRequest(2, 'irrelevant');
		const response = await Container.get(ServicesNotificationTemplateController).createEmailNotificationTemplate(
			1,
			request,
		);
		expect(response).toBeDefined();
		expect(response.data).toEqual(mockItem);
	});

	it('should update an existing email notification template', async () => {
		ServiceNotificationTemplateServiceMock.updateEmailTemplate.mockReturnValue(mockItem);
		const request = new ServiceNotificationTemplateRequest(2, 'irrelevant');
		const response = await Container.get(ServicesNotificationTemplateController).updateEmailNotificationTemplate(
			1,
			request,
		);
		expect(response).toBeDefined();
		expect(response.data).toEqual(mockItem);
	});
});
