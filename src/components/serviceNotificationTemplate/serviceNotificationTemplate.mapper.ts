import { ServiceNotificationTemplate } from '../../models';
import { ServiceNotificationTemplateResponse } from './serviceNotificationTemplate.apicontract';
import { EmailNotificationTemplateType } from '../notifications/notifications.enum';
import { Inject } from 'typescript-ioc';
import { IdHasher } from '../../infrastructure/idHasher';

export class ServiceNotificationTemplateMapper {
	@Inject
	private idHasher: IdHasher;

	public mapToNotificationTemplateResponse = (
		data: ServiceNotificationTemplate,
	): ServiceNotificationTemplateResponse => {
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
		response.id = this.idHasher.encode(id);
		response.emailTemplateType = emailTemplateType;
		response.htmlTemplate = htmlTemplate;
		response.serviceId = serviceId;
		return response;
	};
}
