import { ServiceNotificationTemplate } from '../../models';
import { ServiceNotificationTemplateResponse } from './serviceNotificationTemplate.apicontract';

export const mapToNotificationTemplateResponse = (
	data: ServiceNotificationTemplate,
): ServiceNotificationTemplateResponse => {
	if (!data) {
		return undefined;
	}

	const response = new ServiceNotificationTemplateResponse();
	response.id = data.id;
	response.emailTemplateType = data.emailTemplateType;
	response.htmlTemplate = data.htmlTemplate;
	response.serviceId = data.serviceId;
	return response;
};
