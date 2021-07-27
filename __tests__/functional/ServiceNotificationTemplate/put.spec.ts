import { OrganisationAdminRequestEndpointSG } from '../../utils/requestEndpointSG';
import { PgClient } from '../../utils/pgClient';
import { populateService, populateServiceNotificationTemplate } from '../../populate/basic';
import { EmailNotificationTemplateType } from '../../../src/components/notifications/notifications.enum';
import {ServiceNotificationTemplateResponse} from "../../../src/components/serviceNotificationTemplate/serviceNotificationTemplate.apicontract";

describe('Tests endpoint and populate data for GET request', () => {
	const pgClient = new PgClient();
	const SERVICE_NAME = 'Service';
	const TEMPLATE_TYPE = EmailNotificationTemplateType.CreatedByCitizenSentToCitizen;
	const HTML_TEMPLATE = 'test service notification template';
	const HTML_TEMPLATE_UPDATED = 'update this test service notification template';


	beforeEach(async (done) => {
		await pgClient.cleanAllTables();
		done();
	});
	afterAll(async (done) => {
		await pgClient.cleanAllTables();
		await pgClient.close();
		done();
	});

	it('Get a single email notification template of a service', async () => {
		const service = await populateService({ nameService: SERVICE_NAME });
		const serviceId = service.id;
		await populateServiceNotificationTemplate({
			serviceId: serviceId,
			emailTemplateType: TEMPLATE_TYPE,
			htmlTemplate: HTML_TEMPLATE,
		});

		const response = await OrganisationAdminRequestEndpointSG.create({}).put(
			`/services/${serviceId}/notificationTemplate/email`,
			{
				params: { serviceId: serviceId },
				body: { emailTemplateType: TEMPLATE_TYPE, htmlTemplate: HTML_TEMPLATE_UPDATED },
			},
		);

		expect(response.statusCode).toEqual(200);
		expect((response.body.data as ServiceNotificationTemplateResponse).htmlTemplate).toEqual(HTML_TEMPLATE_UPDATED);
		expect((response.body.data as ServiceNotificationTemplateResponse).id).not.toBeNull();
		expect((response.body.data as ServiceNotificationTemplateResponse).isDefaultTemplate).toEqual(undefined);
	});
});
