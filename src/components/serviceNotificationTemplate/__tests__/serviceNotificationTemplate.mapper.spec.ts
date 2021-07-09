import { Container } from 'typescript-ioc';
import { ServiceNotificationTemplateMapper } from '../serviceNotificationTemplate.mapper';
import { ServiceNotificationTemplate } from '../../../models';

describe('Test the service notification template mapper', () => {
	it('should map template data to ServiceNotificationTemplateResponse', () => {
		const templateData = new ServiceNotificationTemplate();
		templateData.emailTemplateType = 2;
		templateData.htmlTemplate = 'testings notification template';
		templateData.id = 123;
		templateData.serviceId = 1;
		const mapper = Container.get(ServiceNotificationTemplateMapper);

		const ServiceNotificationTemplateResponse = mapper.mapToNotificationTemplateResponse(templateData);
		expect(ServiceNotificationTemplateResponse).toBeDefined();
		expect(ServiceNotificationTemplateResponse.emailTemplateType).toEqual(templateData.emailTemplateType);
		expect(ServiceNotificationTemplateResponse.htmlTemplate).toEqual(templateData.htmlTemplate);
		expect(ServiceNotificationTemplateResponse.id).toEqual(templateData.id);
		expect(ServiceNotificationTemplateResponse.serviceId).toEqual(templateData.serviceId);
	});
});
