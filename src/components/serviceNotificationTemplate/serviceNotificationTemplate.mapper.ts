import { ServiceNotificationTemplate } from '../../models';
import { ServiceNotificationTemplateResponse } from './serviceNotificationTemplate.apicontract';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { EmailNotificationTemplateType } from '../notifications/notifications.enum';

export class ServiceNotificationTemplateMapper {
	public mapToNotificationTemplateResponse = (
		data: ServiceNotificationTemplate,
	): ServiceNotificationTemplateResponse => {
		if (!data || !data.emailTemplateType) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(`Data not found`);
		}
		const response = new ServiceNotificationTemplateResponse();
		return this.mapData(data.id, data.emailTemplateType, data.htmlTemplate, data.serviceId, response);
	};

	public mapGetResponseToNotifTemplateResponse = (
		data: ServiceNotificationTemplate,
	): ServiceNotificationTemplateResponse => {
		const response = this.mapToNotificationTemplateResponse(data);
		response.isDefaultTemplate = false;
		if (!response.id) {
			response.isDefaultTemplate = true;
		}
		return response;
	};

	private mapData = (
		id: number,
		emailTemplateType: EmailNotificationTemplateType,
		htmlTemplate: string,
		serviceId: number,
		response: ServiceNotificationTemplateResponse,
	): ServiceNotificationTemplateResponse => {
		response.id = id;
		response.emailTemplateType = emailTemplateType;
		response.htmlTemplate = htmlTemplate;
		response.serviceId = serviceId;
		return response;
	};
}
