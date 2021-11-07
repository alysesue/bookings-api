import { OrganisationAdminRequestEndpointSG } from '../../../utils/requestEndpointSG';
import { PgClient } from '../../../utils/pgClient';
import { EmailNotificationTemplateType } from '../../../../src/components/notifications/notifications.enum';
import { ServiceNotificationTemplateResponse } from '../../../../src/components/serviceNotificationTemplate/serviceNotificationTemplate.apicontract';
import { populateServiceNotificationTemplate, postService } from '../../../populate/V2/services';

describe('Tests endpoint and populate data for PUT request', () => {
	const pgClient = new PgClient();
	const SERVICE_NAME = 'Service';
	const TEMPLATE_TYPE = EmailNotificationTemplateType.CreatedByCitizenSentToCitizen;
	const HTML_TEMPLATE = 'test service notification template';
	const HTML_TEMPLATE_UPDATED = 'update this test service notification template';

	beforeEach(async () => {
		await pgClient.cleanAllTables();
	});
	afterAll(async () => {
		await pgClient.cleanAllTables();
		await pgClient.close();
	});

	it('PUT a single service email notification template', async () => {
		const service = await postService({ name: SERVICE_NAME });
		const serviceId = service.id;
		const populated = await populateServiceNotificationTemplate({
			serviceId,
			emailTemplateType: TEMPLATE_TYPE,
			htmlTemplate: HTML_TEMPLATE,
		});
		const id = populated.id;

		const response = await OrganisationAdminRequestEndpointSG.create({}).put(
			`/services/${serviceId}/notificationTemplate/email/${id}`,
			{
				params: { serviceId, id },
				body: { emailTemplateType: TEMPLATE_TYPE, htmlTemplate: HTML_TEMPLATE_UPDATED },
			},
			'V2',
		);

		expect(response.statusCode).toEqual(200);
		expect((response.body.data as ServiceNotificationTemplateResponse).htmlTemplate).toEqual(HTML_TEMPLATE_UPDATED);
		expect((response.body.data as ServiceNotificationTemplateResponse).id).toEqual(id);
		expect((response.body.data as ServiceNotificationTemplateResponse).isDefaultTemplate).toEqual(undefined);
	});
});
