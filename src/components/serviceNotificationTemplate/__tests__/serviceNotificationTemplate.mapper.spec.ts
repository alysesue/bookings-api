import { Container } from 'typescript-ioc';
import { ServiceNotificationTemplateMapper } from '../serviceNotificationTemplate.mapper';
import { ServiceNotificationTemplate } from '../../../models';
import { ServiceNotificationTemplateRequest } from '../serviceNotificationTemplate.apicontract';

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
		expect(ServiceNotificationTemplateResponse.emailTemplateType).toEqual(2);
		expect(ServiceNotificationTemplateResponse.htmlTemplate).toEqual('testings notification template');
		expect(ServiceNotificationTemplateResponse.id).toEqual(123);
		expect(ServiceNotificationTemplateResponse.serviceId).toEqual(1);
	});

	it('should map ServiceNotificationTemplateRequest to template data', () => {
        const templateData = new ServiceNotificationTemplate();
		const templateRequest = new ServiceNotificationTemplateRequest(2, 'testings notification template');
		const mapper = Container.get(ServiceNotificationTemplateMapper);

		const ServiceNotificationTemplateData = mapper.mapNotificationTemplateRequestToEntity(templateRequest, templateData);
		expect(ServiceNotificationTemplateData.htmlTemplate).toEqual('testings notification template');
	});
});
