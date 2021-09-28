import { EmailNotificationTemplateType } from '../notifications/notifications.enum';

export class ServiceNotificationTemplateRequest {
	public emailTemplateType: EmailNotificationTemplateType;
	public htmlTemplate: string;

	constructor(emailTemplateType: EmailNotificationTemplateType, htmlTemplate: string) {
		this.emailTemplateType = emailTemplateType;
		this.htmlTemplate = htmlTemplate;
	}
}

export class ServiceNotificationTemplateResponse {
	public id: string;
	public emailTemplateType: EmailNotificationTemplateType;
	public htmlTemplate: string;
	/**
	 * @isInt
	 */
	public serviceId: number;
	public isDefaultTemplate?: boolean;
}

export class ServiceNotificationTemplateResponseV2 {
	public id: string;
	public emailTemplateType: EmailNotificationTemplateType;
	public htmlTemplate: string;
	/**
	 * @isInt
	 */
	public serviceId: string;
	public isDefaultTemplate?: boolean;
}
