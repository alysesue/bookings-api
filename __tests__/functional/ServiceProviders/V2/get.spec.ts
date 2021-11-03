import { OrganisationAdminRequestEndpointSG } from '../../../utils/requestEndpointSG';
import { PgClient } from '../../../utils/pgClient';
import { postService } from '../../../populate/V2/services';
import { populateWeeklyTimesheet, postServiceProvider, putServiceProvider } from '../../../populate/V2/servieProviders';
import { putOrganisationSettings } from '../../../populate/V2/organisation';

describe('Service providers functional tests - get', () => {
	const START_TIME_1 = '09:00';
	const END_TIME_1 = '10:00';
	const pgClient = new PgClient();
	let service;
	let serviceProviders;

	beforeAll(async () => {
		await pgClient.cleanAllTables();
	});

	afterAll(async () => {
		await pgClient.close();
	});
	let orgaSettings;

	beforeEach(async (done) => {
		orgaSettings = await putOrganisationSettings({
			labelSettings: {
				labels: [{ name: 'label1' }, { name: 'label2' }],
				categories: [{ categoryName: 'Sport', labels: [{ name: 'Boxe' }, { name: 'Tennis' }] }],
			},
		});
		service = await postService({ name: 'Service' });
		await postServiceProvider(service.id);
		serviceProviders = await OrganisationAdminRequestEndpointSG.create({ serviceId: service.id }).get(
			'/service-providers',
			{},
			'V2',
		);
	});

	afterEach(async (done) => {
		await pgClient.cleanAllTables();
		done();
	});

	it('should get service provider count', async () => {
		const response = await OrganisationAdminRequestEndpointSG.create({ serviceId: service.id }).get(
			'/service-providers/count',
			{},
			'V2',
		);

		expect(response.statusCode).toEqual(200);
		expect(response.body.data).toEqual({ total: 1 });
	});

	it('should get available service providers', async () => {
		const serviceProviderId = serviceProviders.body.data[0].id;

		await populateWeeklyTimesheet({
			serviceProviderId,
			openTime: START_TIME_1,
			closeTime: END_TIME_1,
			scheduleSlot: 60,
		});
		const response = await OrganisationAdminRequestEndpointSG.create({ serviceId: service.id }).get(
			'/service-providers/available?from=2000-01-01&to=2040-02-01',
			{},
			'V2',
		);

		expect(response.statusCode).toEqual(200);
		expect(response.body.data.length).toEqual(1);
		expect(typeof response.body.data[0].id).toBe('string');
		expect(response.body.data[0].name).toEqual('sp');
		expect(response.body.data[0].email).toEqual('sp@govtech.com');
		expect(response.body.data[0].phone).toEqual('+6580000000');
	});

	it('should get specific service provider', async () => {
		const response = await OrganisationAdminRequestEndpointSG.create({ serviceId: service.id }).get(
			`/service-providers/${serviceProviders.body.data[0].id}`,
			{},
			'V2',
		);

		expect(response.statusCode).toEqual(200);
		expect(typeof response.body.data.id).toBe('string');
		expect(response.body.data.name).toEqual('sp');
		expect(response.body.data.email).toEqual('sp@govtech.com');
		expect(response.body.data.phone).toEqual('+6580000000');
	});

	it('should get specific service provider schedule', async () => {
		const serviceProviderId = serviceProviders.body.data[0].id;
		await populateWeeklyTimesheet({
			serviceProviderId,
			openTime: START_TIME_1,
			closeTime: END_TIME_1,
			scheduleSlot: 60,
		});
		const response = await OrganisationAdminRequestEndpointSG.create({ serviceId: service.id }).get(
			`/service-providers/${serviceProviderId}/scheduleForm`,
			{},
			'V2',
		);

		expect(response.statusCode).toEqual(200);
		expect(response.body.data.weekdaySchedules.length).toEqual(7);
	});

	it('Should filter by service providers', async () => {
		const serviceProvider = serviceProviders.body.data[0];
		const boxeId = orgaSettings.labelSettings.categories
			.find((e) => e.categoryName === 'Sport')
			.labels.find((e) => e.name === 'Boxe').id;
		const tennisId = orgaSettings.labelSettings.categories
			.find((e) => e.categoryName === 'Sport')
			.labels.find((e) => e.name === 'Tennis').id;
		const label1Id = orgaSettings.labelSettings.labels.find((e) => e.name === 'label1').id;
		const label2Id = orgaSettings.labelSettings.labels.find((e) => e.name === 'label2').id;

		await putServiceProvider(serviceProvider.id, {
			...serviceProvider,
			labelIds: [boxeId, label1Id],
		});

		let response = await OrganisationAdminRequestEndpointSG.create({ serviceId: service.id }).get(
			`/service-providers?labelIds=${boxeId}&labelIds=${label2Id}`,
			{},
			'V2',
		);
		expect(response.statusCode).toEqual(200);
		expect(response.body.data.length).toEqual(0);

		response = await OrganisationAdminRequestEndpointSG.create({ serviceId: service.id }).get(
			`/service-providers?labelIds=${boxeId}`,
			{},
			'V2',
		);
		expect(response.body.data.length).toEqual(1);

		response = await OrganisationAdminRequestEndpointSG.create({ serviceId: service.id }).get(
			`/service-providers?labelIds=${boxeId}&labelIds=${label1Id}`,
			{},
			'V2',
		);
		expect(response.body.data.length).toEqual(1);

		response = await OrganisationAdminRequestEndpointSG.create({ serviceId: service.id }).get(
			`/service-providers?labelIds=${tennisId}&labelIds=${label1Id}`,
			{},
			'V2',
		);

		expect(response.body.data.length).toEqual(0);
	});
});
