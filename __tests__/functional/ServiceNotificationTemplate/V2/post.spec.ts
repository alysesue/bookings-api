import { OrganisationAdminRequestEndpointSG } from '../../../utils/requestEndpointSG';
import { PgClient } from '../../../utils/pgClient';
import { populateService } from '../../../populate/basicV2';
import { EmailNotificationTemplateType } from '../../../../src/components/notifications/notifications.enum';
import { ServiceNotificationTemplateResponse } from '../../../../src/components/serviceNotificationTemplate/serviceNotificationTemplate.apicontract';
import { IdHasherForFunctional } from '../../../utils/idHashingUtil';

describe('Tests endpoint and populate data for POST request', () => {
	const pgClient = new PgClient();
	const idHasher = new IdHasherForFunctional();
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

	it('Post a single service email notification template', async () => {
		const service = await populateService({ nameService: SERVICE_NAME });
		const serviceId = await idHasher.convertHashToId(service.id);

		const response = await OrganisationAdminRequestEndpointSG.create({}).post(
			`/services/${serviceId}/notificationTemplate/email`,
			{
				params: { serviceId: serviceId },
				body: { emailTemplateType: TEMPLATE_TYPE, htmlTemplate: HTML_TEMPLATE },
			},
		);

		expect(response.statusCode).toEqual(200);
		expect((response.body.data as ServiceNotificationTemplateResponse).htmlTemplate).toEqual(HTML_TEMPLATE);
		expect((response.body.data as ServiceNotificationTemplateResponse).id).not.toBeNull();
		expect((response.body.data as ServiceNotificationTemplateResponse).isDefaultTemplate).toEqual(undefined);
	});
});
