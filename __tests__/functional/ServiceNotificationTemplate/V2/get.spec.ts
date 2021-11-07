import { OrganisationAdminRequestEndpointSG } from '../../../utils/requestEndpointSG';
import { PgClient } from '../../../utils/pgClient';
import { EmailNotificationTemplateType } from '../../../../src/components/notifications/notifications.enum';
import { ServiceNotificationTemplateResponse } from '../../../../src/components/serviceNotificationTemplate/serviceNotificationTemplate.apicontract';
import { populateServiceNotificationTemplate, postService } from '../../../populate/V2/services';

describe('Tests endpoint and populate data for GET request', () => {
	const pgClient = new PgClient();
	const SERVICE_NAME = 'Service';
	const TEMPLATE_TYPE = EmailNotificationTemplateType.CreatedByCitizenSentToCitizen;
	const HTML_TEMPLATE = 'test service notification template';

	beforeEach(async () => {
		await pgClient.cleanAllTables();
	});
	afterAll(async () => {
		await pgClient.cleanAllTables();
		await pgClient.close();
	});

	it('Get a single SERVICE email notification template', async () => {
		const service = await postService({ name: SERVICE_NAME });
		await populateServiceNotificationTemplate({
			serviceId: service.id,
			emailTemplateType: TEMPLATE_TYPE,
			htmlTemplate: HTML_TEMPLATE,
		});

		const response = await OrganisationAdminRequestEndpointSG.create({}).get(
			`/services/${service.id}/notificationTemplate/email`,
			{
				params: { serviceId: service.id, emailTemplateType: TEMPLATE_TYPE },
			},
			'V2',
		);

		expect(response.statusCode).toEqual(200);
		expect((response.body.data as ServiceNotificationTemplateResponse).htmlTemplate).toEqual(HTML_TEMPLATE);
		expect((response.body.data as ServiceNotificationTemplateResponse).isDefaultTemplate).toEqual(false);
	});

	it('Get a single DEFAULT email notification template', async () => {
		const service = await postService({ name: SERVICE_NAME });

		const response = await OrganisationAdminRequestEndpointSG.create({}).get(
			`/services/${service.id}/notificationTemplate/email`,
			{
				params: { serviceId: service.id, emailTemplateType: TEMPLATE_TYPE },
			},
			'V2',
		);

		expect(response.statusCode).toEqual(200);
		expect((response.body.data as ServiceNotificationTemplateResponse).htmlTemplate).not.toBeNull();
		expect((response.body.data as ServiceNotificationTemplateResponse).isDefaultTemplate).toEqual(true);
	});
});
