import { Container } from 'typescript-ioc';
import { ServiceNotificationTemplateMapper } from '../serviceNotificationTemplate.mapper';
import { ServiceNotificationTemplate } from '../../../models';
import { ServiceNotificationTemplateResponse } from '../serviceNotificationTemplate.apicontract';

describe('Services Notification Template mapper test', () => {
	const mapper = Container.get(ServiceNotificationTemplateMapper);

	it('should map template data to ServiceNotificationTemplateResponse', () => {
		const templateData = ServiceNotificationTemplate.create('testings mapToNotificationTemplateResponse', 1, 2);
		const notificationTemplateResponse = mapper.mapToNotificationTemplateResponse(templateData);
		expect(notificationTemplateResponse).toBeDefined();
		expect(notificationTemplateResponse.htmlTemplate).toEqual(templateData.htmlTemplate);
		expect(notificationTemplateResponse.serviceId).toEqual(templateData.serviceId);
		expect(notificationTemplateResponse.emailTemplateType).toEqual(templateData.emailTemplateType);
	});

	it('should throw error when calling mapToNotificationTemplateResponse with no data', () => {
		const templateData = new ServiceNotificationTemplate();
		const response = () => mapper.mapToNotificationTemplateResponse(templateData);
		expect(response).toThrowErrorMatchingInlineSnapshot('"Data not found"');
	});

	it('should map template response with isDefaultTemplate value', () => {
		const templateData = new ServiceNotificationTemplateResponse();
		templateData.htmlTemplate = 'testing mapGetResponseToNotifTemplateResponse';
		templateData.isDefaultTemplate = true;
		templateData.serviceId = 2;
		templateData.emailTemplateType = 9;

		const notificationTemplateResponse = mapper.mapGetResponseToNotifTemplateResponse(templateData);
		expect(notificationTemplateResponse).toBeDefined();
		expect(notificationTemplateResponse.isDefaultTemplate).toEqual(templateData.isDefaultTemplate);
		expect(notificationTemplateResponse.htmlTemplate).toEqual(templateData.htmlTemplate);
		expect(notificationTemplateResponse.serviceId).toEqual(templateData.serviceId);
		expect(notificationTemplateResponse.emailTemplateType).toEqual(templateData.emailTemplateType);
	});

	it('should throw error when calling mapGetResponseToNotifTemplateResponse with no data', () => {
		const templateData = new ServiceNotificationTemplateResponse();
		const response = () => mapper.mapGetResponseToNotifTemplateResponse(templateData);
		expect(response).toThrowErrorMatchingInlineSnapshot('"Data not found"');
	});
});
