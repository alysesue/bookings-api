import { Container } from 'typescript-ioc';
import { ServiceNotificationTemplateMapper } from '../serviceNotificationTemplate.mapper';
import { ServiceNotificationTemplate } from '../../../models';
// import { ServiceNotificationTemplateResponse } from '../serviceNotificationTemplate.apicontract';

describe('Test the service notification template mapper', () => {
	it('should map template data to ServiceNotificationTemplateResponse', () => {
		const templateData = ServiceNotificationTemplate.create('testings notification template', 1, 2);
		const mapper = Container.get(ServiceNotificationTemplateMapper);
		const ServiceNotificationTemplateResponse = mapper.mapToNotificationTemplateResponse(templateData);
		expect(ServiceNotificationTemplateResponse).toBeDefined();
		expect(ServiceNotificationTemplateResponse.emailTemplateType).toEqual(templateData.emailTemplateType);
		expect(ServiceNotificationTemplateResponse.htmlTemplate).toEqual(templateData.htmlTemplate);
		expect(ServiceNotificationTemplateResponse.id).toEqual(templateData.id);
	});

	it('should throw error when calling ServiceNotificationTemplateResponse with no data', () => {
		const templateData = new ServiceNotificationTemplate();
		const mapper = Container.get(ServiceNotificationTemplateMapper);
		const response = () => mapper.mapToNotificationTemplateResponse(templateData);
		expect(response).toThrowErrorMatchingInlineSnapshot('"Data not found"');
	});

	// it('should map template response to ServiceNotificationTemplateResponse', () => {
	// 	const templateData = new ServiceNotificationTemplateResponse();
	// 	templateData.isDefaultTemplate = false;
	// 	templateData.htmlTemplate = 'testings notification template';
	// 	templateData.emailTemplateType = 1;
	// 	const mapper = Container.get(ServiceNotificationTemplateMapper);
	// 	const ServiceNotificationTemplateResponse = mapper.mapGetResponseToNotifTemplateResponse(templateData);
	// 	expect(ServiceNotificationTemplateResponse).toBeDefined();
	// 	expect(ServiceNotificationTemplateResponse.isDefaultTemplate).toEqual(templateData.isDefaultTemplate);
	// });
});
