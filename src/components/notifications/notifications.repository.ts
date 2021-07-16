import { EmailNotificationTemplateType } from '../../models/notifications';
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
		return defaultTemplates.email[type];
	}
}
