import { OrganisationAdminRequestEndpointSG } from '../../utils/requestEndpointSG';
import { PgClient } from '../../utils/pgClient';
import { populateService, populateServiceWithVC } from '../../populate/basic';
import { ServiceResponse } from '../../../src/components/services/service.apicontract';

describe('Tests endpoint and populate data', () => {
	const SERVICE_NAME = 'Service';
	const SERVICE_NAME_UPDATED = 'ServiceUpdated';
	const pgClient = new PgClient();

	beforeAll(async (done) => {
		await pgClient.cleanAllTables();
		done();
	});
	afterAll(async (done) => {
		await pgClient.close();
		done();
	});

	afterEach(async (done) => {
		await pgClient.cleanAllTables();
		done();
	});

	it("should update first service's name", async () => {
		const service = await populateService({ nameService: SERVICE_NAME });

		const response2 = await OrganisationAdminRequestEndpointSG.create({}).put(`/services/${service.id}`, {
			body: { name: SERVICE_NAME_UPDATED },
		});
		expect(response2.statusCode).toEqual(200);

		const response3 = await OrganisationAdminRequestEndpointSG.create({}).get('/services');
		expect(response3.statusCode).toEqual(200);
		expect(response3.body.data[0].name).toEqual(SERVICE_NAME_UPDATED);
	});

	it('Put service with labels', async () => {
		const service = await populateService({ nameService: SERVICE_NAME });
		const response = await OrganisationAdminRequestEndpointSG.create({}).put(`/services/${service.id}`, {
			body: { name: SERVICE_NAME, labels: [{ label: 'name' }] },
		});
		expect(response.statusCode).toEqual(200);
		expect(response.body.data.labels[0].label).toBe('name');
	});

	it('Put service with same labels (should fail)', async () => {
		const service = await populateService({ nameService: SERVICE_NAME });
		const update1 = await OrganisationAdminRequestEndpointSG.create({}).put(`/services/${service.id}`, {
			body: { name: SERVICE_NAME, labels: [{ label: 'name' }] },
		});
		expect(update1.statusCode).toEqual(200);

		const update2 = await OrganisationAdminRequestEndpointSG.create({}).put(`/services/${service.id}`, {
			body: { name: SERVICE_NAME, labels: [{ label: 'name' }] },
		});

		expect(update2.statusCode).toEqual(400);
		expect(update2.body.errorMessage).toStrictEqual('Label(s) are already present');
	});

	it('Put service with same labels and same id (should pass)', async () => {
		const service = await populateService({ nameService: SERVICE_NAME });
		const update1 = await OrganisationAdminRequestEndpointSG.create({}).put(`/services/${service.id}`, {
			body: { name: SERVICE_NAME, labels: [{ label: 'name' }] },
		});

		const update1Service = update1.body.data as ServiceResponse;
		expect(update1.statusCode).toEqual(200);
		expect(update1Service.labels.length).toEqual(1);
		expect(update1Service.labels[0].label).toEqual('name');
		const update1LabelId = update1Service.labels[0].id;

		const update2 = await OrganisationAdminRequestEndpointSG.create({}).put(`/services/${service.id}`, {
			body: { name: SERVICE_NAME, labels: [{ id: update1LabelId, label: 'name2' }] },
		});
		const update2Service = update2.body.data as ServiceResponse;

		expect(update2.statusCode).toEqual(200);
		expect(update1Service.labels.length).toEqual(1);
		expect(update2Service.labels[0].id).toEqual(update1LabelId);
		expect(update2Service.labels[0].label).toEqual('name2');
	});

	it('Should delete service labels', async () => {
		const service = await populateService({ nameService: SERVICE_NAME });
		const update1 = await OrganisationAdminRequestEndpointSG.create({}).put(`/services/${service.id}`, {
			body: {
				name: SERVICE_NAME,
				labels: [{ label: 'labelA' }, { label: 'labelB' }],
			},
		});
		const update1Service = update1.body.data as ServiceResponse;
		expect(update1.statusCode).toEqual(200);
		expect(update1Service.labels.length).toEqual(2);
		expect(update1Service.labels[0].label).toEqual('labelA');

		const update2 = await OrganisationAdminRequestEndpointSG.create({}).put(`/services/${service.id}`, {
			body: {
				name: SERVICE_NAME,
				labels: [{ id: update1Service.labels[0].id, label: 'labelA_' }],
			},
		});
		const update2Service = update2.body.data as ServiceResponse;

		// Should define an explicit order for labels in the api

		expect(update2.statusCode).toEqual(200);
		expect(update2Service.labels.length).toEqual(1);
		expect(update2Service.labels[0].id).toEqual(update1Service.labels[0].id);
		expect(update2Service.labels[0].label).toEqual('labelA_');
	});

	it("should update service's SP autoAssigned flag", async () => {
		const service = await populateService({ nameService: SERVICE_NAME });

		const response = await OrganisationAdminRequestEndpointSG.create({}).put(`/services/${service.id}`, {
			body: { name: SERVICE_NAME_UPDATED, isSpAutoAssigned: true },
		});
		expect(response.statusCode).toEqual(200);
		expect(response.body.data.isSpAutoAssigned).toBe(true);

		const response2 = await OrganisationAdminRequestEndpointSG.create({}).put(`/services/${service.id}`, {
			body: { name: SERVICE_NAME_UPDATED, isSpAutoAssigned: false },
		});
		expect(response2.statusCode).toEqual(200);
		expect(response2.body.data.isSpAutoAssigned).toBe(false);
	});

	it("should update service's video conference URL", async () => {
		const service = await populateServiceWithVC({ nameService: SERVICE_NAME });

		const response = await OrganisationAdminRequestEndpointSG.create({}).put(`/services/${service.id}`, {
			body: { name: SERVICE_NAME, videoConferenceUrl: 'http://www.zoom.us/7654321' },
		});
		expect(response.statusCode).toEqual(200);
		expect(response.body.data.videoConferenceUrl).toBe('http://www.zoom.us/7654321');
	});

	it("should not update service's video conference URL", async () => {
		const service = await populateServiceWithVC({ nameService: SERVICE_NAME });

		const response = await OrganisationAdminRequestEndpointSG.create({}).put(`/services/${service.id}`, {
			body: { name: SERVICE_NAME, videoConferenceUrl: 'www.zoom.us/7654321' },
		});
		expect(response.statusCode).toEqual(404);
		expect(response.body.errorCode).toBe('SYS_NOT_FOUND');
		expect(response.body.errorMessage).toBe('Invalid URL');
	});
});
