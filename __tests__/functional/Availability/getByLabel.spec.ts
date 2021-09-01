import { PgClient } from '../../utils/pgClient';
import { populateOneOffTimeslot, populateServiceAndServiceProvider } from '../../populate/basic';
import { AnonmymousEndpointSG } from '../../utils/requestEndpointSG';

describe('Timeslot availability filter by label', () => {
	const pgClient = new PgClient();
	const NAME_SERVICE_1 = 'service1';

	let serviceProvider1;
	let service1;
	let englishLabel;
	let frenchLabel;

	afterAll(async (done) => {
		await pgClient.cleanAllTables();
		await pgClient.close();
		done();
	});

	beforeEach(async (done) => {
		await pgClient.cleanAllTables();

		const { service, serviceProvider } = await populateServiceAndServiceProvider({
			nameService: NAME_SERVICE_1,
			labels: [{ label: 'French' }, { label: 'English' }],
		});
		service1 = service;
		serviceProvider1 = serviceProvider;
		englishLabel = service.labels.find((e) => e.label === 'English');
		frenchLabel = service.labels.find((e) => e.label === 'French');

		await populateOneOffTimeslot({
			serviceProviderId: serviceProvider1[0].id,
			startTime: new Date('2021-03-05T08:00:00Z'),
			endTime: new Date('2021-03-05T09:00:00Z'),
			labelIds: [englishLabel.id],
			capacity: 5,
		});
		await populateOneOffTimeslot({
			serviceProviderId: serviceProvider1[0].id,
			startTime: new Date('2021-03-05T05:00:00Z'),
			endTime: new Date('2021-03-05T06:00:00Z'),
			labelIds: [frenchLabel.id],
			capacity: 3,
		});


		done();
	});

	it('should be intersection by default', async () => {
		await pgClient.configureServiceAllowAnonymous({ serviceId: service1.id });

		const endpoint = await AnonmymousEndpointSG.create({ serviceId: service1.id });
		let response = await endpoint.get(
			`/timeslots/availability?startDate=2021-03-05T00:00:00&endDate=2021-03-05T15:59:59.999Z&labelIds=${frenchLabel.id}&labelIds=${englishLabel.id}`,
		);
		expect(response.statusCode).toBe(200);
		expect(response.body.data.length).toBe(0);

		response = await endpoint.get(
			`/timeslots/availability?startDate=2021-03-05T00:00:00&endDate=2021-03-05T15:59:59.999Z`,
		);
		expect(response.statusCode).toBe(200);
		expect(response.body.data.length).toBe(2);
	});

	it('should be none if intersection', async () => {
		await pgClient.configureServiceAllowAnonymous({ serviceId: service1.id });

		const endpoint = await AnonmymousEndpointSG.create({ serviceId: service1.id });
		const response = await endpoint.get(
			`/timeslots/availability?labelOperationFiltering=intersection&startDate=2021-03-05T00:00:00&endDate=2021-03-05T15:59:59.999Z&labelIds=${frenchLabel.id}&labelIds=${englishLabel.id}`,
		);
		expect(response.statusCode).toBe(200);
		expect(response.body.data.length).toBe(0);
	});

	it('should be 2 if union', async () => {
		await pgClient.configureServiceAllowAnonymous({ serviceId: service1.id });

		const endpoint = await AnonmymousEndpointSG.create({ serviceId: service1.id });
		const response = await endpoint.get(
			`/timeslots/availability?labelOperationFiltering=union&startDate=2021-03-05T00:00:00&endDate=2021-03-05T15:59:59.999Z&labelIds=${frenchLabel.id}&labelIds=${englishLabel.id}`,
		);
		expect(response.statusCode).toBe(200);
		expect(response.body.data.length).toBe(2);
	});
});
