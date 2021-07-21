import { ServiceNotificationTemplate } from '../../models';
import { ServiceNotificationTemplateResponse } from './serviceNotificationTemplate.apicontract';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { EmailNotificationTemplateType } from '../../enums/notifications';

export class ServiceNotificationTemplateMapper {
	public mapToNotificationTemplateResponse = (
		data: ServiceNotificationTemplate,
	): ServiceNotificationTemplateResponse => {
		if (!data || !data.emailTemplateType || !data.serviceId) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(`Data not found`);
		}

		const response = new ServiceNotificationTemplateResponse();
		return this.mapData(data.id, data.emailTemplateType, data.htmlTemplate, data.serviceId, response);
	};

	public mapGetResponseToNotifTemplateResponse = (
		data: ServiceNotificationTemplateResponse,
	): ServiceNotificationTemplateResponse => {
		if (!data || !data.emailTemplateType || !data.serviceId) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(`Data not found`);
		}

		let response = new ServiceNotificationTemplateResponse();
		response = this.mapData(data.id, data.emailTemplateType, data.htmlTemplate, data.serviceId, response);
		response.isDefaultTemplate = data.isDefaultTemplate;

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
