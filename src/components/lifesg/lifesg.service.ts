import { InRequestScope } from 'typescript-ioc';
import { getConfig } from '../../config/app-config';
import { CreateAppointmentRequestApiDomain } from 'mol-lib-api-contract/appointment/create-appointment/api-domain';
import { CancelAppointmentRequestApiDomain } from 'mol-lib-api-contract/appointment/cancel-appointment/api-domain';
import { DeleteAppointmentRequestApiDomain } from 'mol-lib-api-contract/appointment/delete-appointment/api-domain';
import { ExternalAgencyAppointmentJobAction } from './lifesg.apicontract';
import { logger } from 'mol-lib-common';
const container = require('rhea');
import { ConnectionDetails } from 'rhea';
import { UpdateAppointmentRequestApiDomain } from 'mol-lib-api-contract/appointment/update-appointment/api-domain';

@InRequestScope
export class LifeSGMQSerice {
	public async send(
		appointment: CreateAppointmentRequestApiDomain | DeleteAppointmentRequestApiDomain,
		action: ExternalAgencyAppointmentJobAction,
	) {
		const LIFESG_QUEUE = 'ExternalAgencyAppointment';
		let attempt = -1;

		try {
			const connection = container.connect({
				username: getConfig().mqConfig.username,
				password: getConfig().mqConfig.password,
				idle_time_out: getConfig().mqConfig.idle_time_out,
				reconnect: true,
				connection_details: (): ConnectionDetails => {
					attempt++;
					const host = getConfig().mqConfig.hosts[attempt % getConfig().mqConfig.hosts.length];
					return {
						host,
						port: getConfig().mqConfig.port,
						transport: getConfig().mqConfig.transport,
					};
				},
			});
			connection.open_sender(LIFESG_QUEUE);
			const amqp_message = container.message;
			container.once('sender_open', (context) => {
				const stringifiedPayload = JSON.stringify({ action, appointment });
				const body = amqp_message.data_section(Buffer.from(stringifiedPayload, 'utf8'));
				context.sender.send({ body });
				context.connection.close();
			});
		} catch (error) {
			logger.error(error);
		}
	}
}
