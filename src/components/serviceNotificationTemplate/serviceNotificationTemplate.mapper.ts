import { ServiceNotificationTemplate } from '../../models';
import { ServiceNotificationTemplateResponse } from './serviceNotificationTemplate.apicontract';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';

export class ServiceNotificationTemplateMapper {
	public mapToNotificationTemplateResponse = (
		data: ServiceNotificationTemplate,
	): ServiceNotificationTemplateResponse => {
		if (!data) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(`Data not found`);
		}

		const response = new ServiceNotificationTemplateResponse();
		response.id = data.id;
		response.emailTemplateType = data.emailTemplateType;
		response.htmlTemplate = data.htmlTemplate;
		response.serviceId = data.serviceId;
		return response;
	};
}
