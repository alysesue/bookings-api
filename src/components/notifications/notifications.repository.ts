import { EmailNotificationTemplateType } from './notifications.enum';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { defaultTemplates } from './templates/defaultNotificationTemplate';
import { InRequestScope } from 'typescript-ioc';

@InRequestScope
export class NotificationsRepository {
	public getDefaultEmailNotificationTemplateByType(emailTemplateType: EmailNotificationTemplateType): string {
		if (!emailTemplateType) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(`Invalid request`);
		}
		const type = EmailNotificationTemplateType[emailTemplateType].toString();
		if (type.includes('Event')) {
			return defaultTemplates.email['DefaultEventNotification'];
		}
		return defaultTemplates.email[type];
	}
}
