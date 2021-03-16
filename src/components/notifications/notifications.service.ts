import { InRequestScope } from 'typescript-ioc';

@InRequestScope
export class NotificationsService {
	public async sendEmail({ body }): Promise<void> {
		console.log('==============================');
		console.log(require('util').inspect(body, false, null, true /* enable colors */));
		console.log('==============================');
	}
}
