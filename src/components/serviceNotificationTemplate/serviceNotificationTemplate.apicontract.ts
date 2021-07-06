import { EmailNotificationTemplateType } from '../../models/notifications';

export class ServiceNotificationTemplateModel {
	public emailTemplateType: EmailNotificationTemplateType;
	public htmlTemplate: string;

	constructor(emailTemplateType: EmailNotificationTemplateType, htmlTemplate: string) {
		this.emailTemplateType = emailTemplateType;
		this.htmlTemplate = htmlTemplate;
	}
}

export class ServiceNotificationTemplateResponseModel {
	public id: string;
	public emailTemplateType: EmailNotificationTemplateType;
	public htmlTemplate: string;
	/**
	 * @isInt
	 */
	public serviceId: number;
}
