import { InRequestScope } from 'typescript-ioc';
import { getConfig } from '../../config/app-config';
import { CreateAppointmentRequestApiDomain } from 'mol-lib-api-contract/appointment/create-appointment/api-domain';
import { DeleteAppointmentRequestApiDomain } from 'mol-lib-api-contract/appointment/delete-appointment/api-domain';
import { ExternalAgencyAppointmentJobAction } from './lifesg.apicontract';
import { logger } from 'mol-lib-common';
const container = require('rhea');
import { ConnectionDetails } from 'rhea';

interface Payload {
	appointment: CreateAppointmentRequestApiDomain | DeleteAppointmentRequestApiDomain;
	action: ExternalAgencyAppointmentJobAction;
}
@InRequestScope
export class LifeSGMQService {
	public async sendMultiple(payloads: Payload[]) {
		const LIFESG_QUEUE = 'ExternalAgencyAppointment';
		let attempt = -1;
		let confirmed = 0;
		const total = payloads.length;

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
				payloads.forEach((payload: Payload) => {
					const { action, appointment } = payload;
					const stringifiedPayload = JSON.stringify({ action, appointment });
					const body = amqp_message.data_section(Buffer.from(stringifiedPayload, 'utf8'));
					context.sender.send({ body });
				});
			});

			container.on('accepted', function (context) {
				if (++confirmed === total) {
					const loggedObj = payloads.map(
						(p) =>
							`{action: ${p.action}, agency: ${p.appointment.agency}, agencyTransactionId: ${p.appointment.agencyTransactionId}}`,
					);
					logger.info(`[LifeSGMQService] total ${total} data sent to ${LIFESG_QUEUE}, ${loggedObj}`);
					context.connection.close();
				}
			});
		} catch (error) {
			logger.error('Error sending appointment to lifesg', { error });
		}
	}

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
				logger.info('Sending appointment to lifesg', {
					action,
					id: `${appointment.agency}-${appointment.agencyTransactionId}`,
				});
				context.sender.send({ body });
				context.connection.close();
				logger.info(
					`[LifeSGMQService] data sent to ${LIFESG_QUEUE}, action: ${action}, agency: ${appointment.agency}, agencyTransactionId: ${appointment.agencyTransactionId}`,
				);
			});
		} catch (error) {
			logger.error('Error sending appointment to lifesg', { error });
		}
	}
}
