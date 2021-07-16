import { EmailNotificationTemplateType } from '../../models/notifications';

export class ServiceNotificationTemplateRequest {
	public emailTemplateType: EmailNotificationTemplateType;
	public htmlTemplate: string;

	constructor(emailTemplateType: EmailNotificationTemplateType, htmlTemplate: string) {
		this.emailTemplateType = emailTemplateType;
		this.htmlTemplate = htmlTemplate;
	}
}

export class ServiceNotificationTemplateResponse {
	public id: number;
	public emailTemplateType: EmailNotificationTemplateType;
	public htmlTemplate: string;
	/**
	 * @isInt
	 */
	public serviceId: number;
	public isDefaultTemplate?: boolean;
}
