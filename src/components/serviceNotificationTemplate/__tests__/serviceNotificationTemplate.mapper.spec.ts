import { Container } from 'typescript-ioc';
import { ServiceNotificationTemplateMapper } from '../serviceNotificationTemplate.mapper';
import { ServiceNotificationTemplate } from '../../../models';

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

	it('should map template response with isDefaultTemplate value equals to true', () => {
		const templateData = new ServiceNotificationTemplate();
		templateData.htmlTemplate = 'testing mapGetResponseToNotifTemplateResponse';
		templateData.emailTemplateType = 9;

		const notificationTemplateResponse = mapper.mapGetResponseToNotifTemplateResponse(templateData);
		expect(notificationTemplateResponse).toBeDefined();
		expect(notificationTemplateResponse.isDefaultTemplate).toEqual(true);
		expect(notificationTemplateResponse.htmlTemplate).toEqual(templateData.htmlTemplate);
		expect(notificationTemplateResponse.serviceId).toEqual(undefined);
		expect(notificationTemplateResponse.emailTemplateType).toEqual(templateData.emailTemplateType);
	});

	it('should map template response with isDefaultTemplate value equals to false', () => {
		const templateData = new ServiceNotificationTemplate();
		templateData.htmlTemplate = 'testing mapGetResponseToNotifTemplateResponse';
		templateData.emailTemplateType = 9;
		templateData.id = 123;

		const notificationTemplateResponse = mapper.mapGetResponseToNotifTemplateResponse(templateData);
		expect(notificationTemplateResponse).toBeDefined();
		expect(notificationTemplateResponse.isDefaultTemplate).toEqual(false);
		expect(notificationTemplateResponse.htmlTemplate).toEqual(templateData.htmlTemplate);
		expect(notificationTemplateResponse.emailTemplateType).toEqual(templateData.emailTemplateType);
	});

});
