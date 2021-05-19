import { PgClient } from "../../utils/pgClient";
import { OrganisationAdminRequestEndpointSG } from "../../utils/requestEndpointSG";
import { ServiceResponse } from "../../../src/components/services/service.apicontract";
import { CategoryRequestModel } from "../../../src/components/labelsCategories/categories.apicontract";

describe('Tests endpoint', () => {
	const SERVICE_NAME = 'Service1';
	const pgClient = new PgClient();
	let categories: CategoryRequestModel[] = [{categoryName: 'category'}];
	let labels = [{ label: 'labelNoCategory' }]
	let response;
	let serviceCreated;

	beforeAll(async (done) => {
		await pgClient.cleanAllTables();
		done();
	});
	afterAll(async (done) => {
		await pgClient.close();
		done();
	});

	afterEach(async (done) => {
		// await pgClient.cleanAllTables();
		done();
	});
	beforeEach(async (done) => {
		await pgClient.cleanAllTables();
		categories = [{categoryName: 'category', labels: [{label: 'labelCategory'}]}];
		response = await OrganisationAdminRequestEndpointSG.create({}).post('/services', {
			body: { name: SERVICE_NAME, labels, categories  },
		});
		serviceCreated = response.body.data as ServiceResponse;
		expect(response.statusCode).toEqual(200);
		expect(serviceCreated.labels[0].label).toBe('labelNoCategory');
		expect(serviceCreated.categories[0].categoryName).toBe('category');

		expect(serviceCreated.categories[0].labels[0].label).toBe('labelCategory');
		labels= [...serviceCreated.labels]
		categories = [...serviceCreated.categories]
		done()
	})

	it('Should update service with a new category', async () => {
		const newCategories = [serviceCreated.categories[0],{ categoryName: 'category2', labels: []}]
		response = await OrganisationAdminRequestEndpointSG.create({}).put(`/services/${serviceCreated.id}`, {
			body: { name: SERVICE_NAME, labels, categories: newCategories },
		});
		const service = response.body.data as ServiceResponse;
		expect(response.statusCode).toEqual(200);
		expect(service.categories.length).toBe(2);
	});

	xit('Should update service with label in category deleted', async () => {
		const newCategories = [{id: serviceCreated.categories[0].id, categoryName: 'category', labels: []}]
		response = await OrganisationAdminRequestEndpointSG.create({}).put(`/services/${serviceCreated.id}`, {
			body: { name: SERVICE_NAME, labels, categories: newCategories },
		});
		const service = response.body.data as ServiceResponse;
		expect(response.statusCode).toEqual(200);
		expect(service.labels[0].label).toBe('labelNoCategory');
		expect(service.categories.length).toBe(1);
		expect(service.categories[0].labels.length).toBe(0);
	});

	xit('Should update service with category fully deleted', async () => {
		response = await OrganisationAdminRequestEndpointSG.create({}).put(`/services/${serviceCreated.id}`, {
			body: { name: SERVICE_NAME, labels, categories: []  },
		});
		const service = response.body.data as ServiceResponse;
		expect(response.statusCode).toEqual(200);
		expect(service.labels[0].label).toBe('labelNoCategory');
		expect(service.categories.length).toBe(0);
	});

	xit('Update service with label moved in no category', async () => {
		const allLabels = [...labels, ...categories[0].labels];
		console.log('all', allLabels);
		response = await OrganisationAdminRequestEndpointSG.create({}).put(`/services/${serviceCreated.id}`, {
			body: { name: SERVICE_NAME, labels: [...allLabels], categories: []  },
		});
		const service = response.body.data as ServiceResponse;
		expect(response.statusCode).toEqual(200);
		expect(service.labels.length).toBe(2);
		expect(service.labels[0].label).toBe('labelNoCategory');
		expect(service.categories.length).toBe(0);
	});

	xit('Should merge label if same name in same category ', async () => {
		categories[0].labels = [...categories[0].labels, { label: 'labelCategory' }]
		response = await OrganisationAdminRequestEndpointSG.create({}).put(`/services/${serviceCreated.id}`, {
			body: { name: SERVICE_NAME, categories  },
		});
		const service = response.body.data as ServiceResponse;
		expect(response.statusCode).toEqual(200);
		console.log('res', response.status);
		expect(service.categories.length).toBe(1);
		expect(service.categories[0].labels.length).toBe(1);
	});

	xit('Update service with label moved in no category but name already present', async () => {
		let allLabels = [...labels, { label: 'labelCategory' }];
		response = await OrganisationAdminRequestEndpointSG.create({}).put(`/services/${serviceCreated.id}`, {
			body: { name: SERVICE_NAME, labels: [...allLabels], categories },
		});
		let service = response.body.data as ServiceResponse;
		expect(response.statusCode).toEqual(200);
		allLabels = [...service.labels, ...categories[0].labels];
		console.log('service.labels',service.labels);
		console.log('categories.labels',categories[0].labels);

		response = await OrganisationAdminRequestEndpointSG.create({}).put(`/services/${serviceCreated.id}`, {
			body: { name: SERVICE_NAME, labels: [...allLabels], categories: [] },
		});
		service = response.body.data as ServiceResponse;
		console.log('service.labels',service.labels);
		expect(response.statusCode).toEqual(200);
		expect(service.labels.length).toBe(2);
		expect(service.labels[0].label).toBe('labelNoCategory');
		expect(service.categories.length).toBe(0);
	});
});
