import { OrganisationAdminRequestEndpointSG } from '../../../utils/requestEndpointSG';
import { PgClient } from '../../../utils/pgClient';
import { populateService, populateServiceNotificationTemplate } from '../../../populate/basicV1';
import { EmailNotificationTemplateType } from '../../../../src/components/notifications/notifications.enum';
import { ServiceNotificationTemplateResponse } from '../../../../src/components/serviceNotificationTemplate/serviceNotificationTemplate.apicontract';

describe('Tests endpoint and populate data for GET request', () => {
	const pgClient = new PgClient();
	const SERVICE_NAME = 'Service';
	const TEMPLATE_TYPE = EmailNotificationTemplateType.CreatedByCitizenSentToCitizen;
	const HTML_TEMPLATE = 'test service notification template';

	beforeEach(async (done) => {
		await pgClient.cleanAllTables();
		done();
	});
	afterAll(async (done) => {
		await pgClient.cleanAllTables();
		await pgClient.close();
		done();
	});

	it('Get a single SERVICE email notification template', async () => {
		const service = await populateService({ nameService: SERVICE_NAME });
		const serviceId = service.id;
		await populateServiceNotificationTemplate({
			serviceId: serviceId,
			emailTemplateType: TEMPLATE_TYPE,
			htmlTemplate: HTML_TEMPLATE,
		});

		const response = await OrganisationAdminRequestEndpointSG.create({}).get(
			`/services/${serviceId}/notificationTemplate/email`,
			{
				params: { serviceId: serviceId, emailTemplateType: TEMPLATE_TYPE },
			},
		);

		expect(response.statusCode).toEqual(200);
		expect((response.body.data as ServiceNotificationTemplateResponse).htmlTemplate).toEqual(HTML_TEMPLATE);
		expect((response.body.data as ServiceNotificationTemplateResponse).isDefaultTemplate).toEqual(false);
	});

	it('Get a single DEFAULT email notification template', async () => {
		const service = await populateService({ nameService: SERVICE_NAME });
		const serviceId = service.id;

		const response = await OrganisationAdminRequestEndpointSG.create({}).get(
			`/services/${serviceId}/notificationTemplate/email`,
			{
				params: { serviceId: serviceId, emailTemplateType: TEMPLATE_TYPE },
			},
		);

		expect(response.statusCode).toEqual(200);
		expect((response.body.data as ServiceNotificationTemplateResponse).htmlTemplate).not.toBeNull();
		expect((response.body.data as ServiceNotificationTemplateResponse).isDefaultTemplate).toEqual(true);
	});
});
