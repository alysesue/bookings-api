import { ServiceNotificationTemplate } from '../../models';
import {
	ServiceNotificationTemplateRequest,
	ServiceNotificationTemplateResponse,
} from './serviceNotificationTemplate.apicontract';

export class ServiceNotificationTemplateMapper {
	public mapToNotificationTemplateResponse = (
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

	public mapTemplateToEntity = (
		data: ServiceNotificationTemplateRequest,
		entity: ServiceNotificationTemplate,
	): ServiceNotificationTemplate => {
		if (!data) {
			return undefined;
		}

		entity.htmlTemplate = data.htmlTemplate;
		return entity;
	};
}
