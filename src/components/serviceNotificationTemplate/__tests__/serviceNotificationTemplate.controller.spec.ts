import { Container } from 'typescript-ioc';
import { ServicesNotificationTemplateController } from '../serviceNotificationTemplate.controller';
import { ServiceNotificationTemplateService } from '../serviceNotificationTemplate.service';
import {
	ServiceNotificationTemplateRequest,
	ServiceNotificationTemplateResponse,
} from '../serviceNotificationTemplate.apicontract';
import { ServiceNotificationTemplateServiceMock } from '../__mock__/serviceNotificationTemplate.service.mock';
import { ServiceNotificationTemplate } from '../../../models';

describe('Services Notification Template controller tests', () => {
	beforeAll(() => {
		Container.bind(ServiceNotificationTemplateService).to(ServiceNotificationTemplateServiceMock);
	});

	const mockItem = ServiceNotificationTemplate.create('get template', 1, 2);
	const expectedResponse = new ServiceNotificationTemplateResponse();
	expectedResponse.id = mockItem.id;
	expectedResponse.htmlTemplate = mockItem.htmlTemplate;
	expectedResponse.emailTemplateType = mockItem.emailTemplateType;
	expectedResponse.serviceId = 1;

	it('should get an email notification template', async () => {
		const expectedGetResponse = { ...expectedResponse };
		expectedGetResponse.isDefaultTemplate = true;
		ServiceNotificationTemplateServiceMock.getEmailMock.mockReturnValue(mockItem);
		const response = await Container.get(ServicesNotificationTemplateController).getEmailNotificationTemplate(1, 2);
		expect(response.data).toEqual(expectedGetResponse);
	});

	it('should create an email notification template', async () => {
		ServiceNotificationTemplateServiceMock.addEmailMock.mockReturnValue(mockItem);
		const request = new ServiceNotificationTemplateRequest(2, 'irrelevant');
		const response = await Container.get(ServicesNotificationTemplateController).createEmailNotificationTemplate(
			1,
			request,
		);
		expect(response).toBeDefined();
		expect(response.data).toEqual(expectedResponse);
	});

	it('should update an existing email notification template', async () => {
		ServiceNotificationTemplateServiceMock.updateEmailMock.mockReturnValue(mockItem);
		const request = new ServiceNotificationTemplateRequest(2, 'irrelevant');
		const response = await Container.get(ServicesNotificationTemplateController).updateEmailNotificationTemplate(
			1,
			request,
		);
		expect(response).toBeDefined();
		expect(response.data).toEqual(expectedResponse);
	});
});
