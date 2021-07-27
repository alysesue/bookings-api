import { Container } from 'typescript-ioc';
import { ServicesNotificationTemplateController } from '../serviceNotificationTemplate.controller';
import { ServiceNotificationTemplateService } from '../serviceNotificationTemplate.service';
import {
	ServiceNotificationTemplateRequest,
	ServiceNotificationTemplateResponse,
} from '../serviceNotificationTemplate.apicontract';
import { ServiceNotificationTemplateServiceMock } from '../__mock__/serviceNotificationTemplate.service.mock';
import { ServiceNotificationTemplate } from '../../../models';
import { IdHasher } from '../../../infrastructure/idHasher';
import { IdHasherMock } from '../../../infrastructure/__mocks__/idHasher.mock';

describe('Services Notification Template controller tests', () => {
	const serviceId = 1;
	const templateId = 123;
	const templateType = 2;
	const htmlTemplate = 'This is a test';
	beforeAll(() => {
		Container.bind(ServiceNotificationTemplateService).to(ServiceNotificationTemplateServiceMock);
		Container.bind(IdHasher).to(IdHasherMock);
	});

	beforeEach(() => {
		jest.resetAllMocks();
		IdHasherMock.encode.mockImplementation((id: number) => id.toString());
		IdHasherMock.decode.mockImplementation((id: string) => Number.parseInt(id, 10));
	});

	const mockServiceTemplate = ServiceNotificationTemplate.create(htmlTemplate, serviceId, templateType);
	mockServiceTemplate.id = templateId;
	const mockedItemHashedId = (mockServiceTemplate.id).toString();
	const expectedResponse = new ServiceNotificationTemplateResponse();
	expectedResponse.id = mockedItemHashedId;
	expectedResponse.htmlTemplate = htmlTemplate;
	expectedResponse.emailTemplateType = templateType;
	expectedResponse.serviceId = serviceId;


	it('should get a default email notification template', async () => {
		jest.resetAllMocks();
		const mockDefaultTemplate = ServiceNotificationTemplate.create(htmlTemplate, undefined, templateType);

		const expectedDefaultTemplateResponse = new ServiceNotificationTemplateResponse();
		expectedDefaultTemplateResponse.isDefaultTemplate = true;
		expectedDefaultTemplateResponse.htmlTemplate = htmlTemplate;
		expectedDefaultTemplateResponse.emailTemplateType = templateType;
		expectedDefaultTemplateResponse.id = undefined;
		expectedDefaultTemplateResponse.serviceId = undefined;

		ServiceNotificationTemplateServiceMock.getEmailMock.mockReturnValue(mockDefaultTemplate);
		const response = await Container.get(ServicesNotificationTemplateController).getEmailNotificationTemplate(
			serviceId,
			templateType,
		);
		expect(response.data).toEqual(expectedDefaultTemplateResponse);
	});

	it('should get a service email notification template', async () => {
		const expectedGetResponse = {...expectedResponse};
		expectedGetResponse.isDefaultTemplate = false;
		ServiceNotificationTemplateServiceMock.getEmailMock.mockReturnValue(mockServiceTemplate);
		const response = await Container.get(ServicesNotificationTemplateController).getEmailNotificationTemplate(
			serviceId,
			templateType,
		);
		expect(response.data).toEqual(expectedGetResponse);
	});

	it('should create an email notification template', async () => {
		ServiceNotificationTemplateServiceMock.addEmailMock.mockReturnValue(mockServiceTemplate);
		const request = new ServiceNotificationTemplateRequest(templateType, 'irrelevant');
		const response = await Container.get(ServicesNotificationTemplateController).createEmailNotificationTemplate(
			serviceId,
			request,
		);
		expect(response).toBeDefined();
		expect(response.data).toEqual(expectedResponse);
	});

	it('should update an existing email notification template', async () => {
		ServiceNotificationTemplateServiceMock.updateEmailMock.mockReturnValue(mockServiceTemplate);
		const request = new ServiceNotificationTemplateRequest(templateType, 'irrelevant');
		const response = await Container.get(ServicesNotificationTemplateController).updateEmailNotificationTemplate(
			serviceId,
			mockedItemHashedId,
			request,
		);
		expect(response).toBeDefined();
		expect(response.data).toEqual(expectedResponse);
	});
});
