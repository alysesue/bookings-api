import { Container } from 'typescript-ioc';
import { ServiceNotificationTemplateMapper } from '../serviceNotificationTemplate.mapper';
import { ServiceNotificationTemplate } from '../../../models';
import { IdHasherMock } from '../../../infrastructure/__mocks__/idHasher.mock';
import {IdHasher} from "../../../infrastructure/idHasher";

describe('Services Notification Template mapper test', () => {
	const mapper = Container.get(ServiceNotificationTemplateMapper);
	const serviceId = 1;
	const templateId = 123;
	const templateType = 9;
	const htmlTemplate = "This is a test";

	beforeAll(() => {
		Container.bind(IdHasher).to(IdHasherMock);
	})

	beforeEach(() => {
		jest.resetAllMocks();
	})

	it('should map template data to NotificationTemplateResponse', () => {
		IdHasherMock.encode.mockImplementation((id: number) => id.toString());
		const templateData = ServiceNotificationTemplate.create(htmlTemplate, serviceId, templateType);
		templateData.id = templateId;

		const notificationTemplateResponse = mapper.mapToNotificationTemplateResponse(templateData);
		expect(notificationTemplateResponse).toBeDefined();
		expect(notificationTemplateResponse.htmlTemplate).toEqual(templateData.htmlTemplate);
		expect(notificationTemplateResponse.serviceId).toEqual(templateData.serviceId);
		expect(notificationTemplateResponse.emailTemplateType).toEqual(templateData.emailTemplateType);
	});

	it('should map template GET response with isDefaultTemplate value equals to true', () => {
		const templateData = new ServiceNotificationTemplate();
		templateData.htmlTemplate = htmlTemplate;
		templateData.emailTemplateType = templateType;

		const notificationTemplateResponse = mapper.mapGetResponseToNotifTemplateResponse(templateData);
		expect(notificationTemplateResponse).toBeDefined();
		expect(notificationTemplateResponse.isDefaultTemplate).toEqual(true);
		expect(notificationTemplateResponse.htmlTemplate).toEqual(templateData.htmlTemplate);
		expect(notificationTemplateResponse.serviceId).toEqual(undefined);
		expect(notificationTemplateResponse.emailTemplateType).toEqual(templateData.emailTemplateType);
	});

	it('should map template GET response with isDefaultTemplate value equals to false', () => {
		IdHasherMock.encode.mockImplementation((id: number) => id.toString());
		const templateData = new ServiceNotificationTemplate();
		templateData.htmlTemplate = htmlTemplate;
		templateData.emailTemplateType = templateType;
		templateData.id = templateId;

		const notificationTemplateResponse = mapper.mapGetResponseToNotifTemplateResponse(templateData);
		expect(notificationTemplateResponse).toBeDefined();
		expect(notificationTemplateResponse.isDefaultTemplate).toEqual(false);
		expect(notificationTemplateResponse.htmlTemplate).toEqual(templateData.htmlTemplate);
		expect(notificationTemplateResponse.emailTemplateType).toEqual(templateData.emailTemplateType);
	});
});
