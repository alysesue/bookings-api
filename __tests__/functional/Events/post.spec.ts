// tslint:disable-next-line: no-big-function
import { PgClient } from '../../utils/pgClient';
import { getEventRequest, getOneOffTimeslotRequest, populateEvent } from '../../populate/events';
import { populateServiceAndServiceProvider } from '../../populate/serviceProvider';
import { DateHelper } from '../../../src/infrastructure/dateHelper';

describe('Event post functional tests', () => {
	const pgClient = new PgClient();
	let service;
	let serviceProvider;

	beforeEach(async (done) => {
		await pgClient.cleanAllTables();
		const { service: srv, serviceProvider: sp } = await populateServiceAndServiceProvider({
			categories: [
				{ categoryName: 'Location', labels: [{ label: 'Toa Payoh' }, { label: 'Sydney' }] },
				{ categoryName: 'Language', labels: [{ label: 'Chinese' }, { label: 'English' }, { label: 'Malay' }] },
				{ categoryName: 'Program Type', labels: [{ label: 'Virtual' }, { label: 'On-site' }] },
			],
			labels: ['Marriage', 'Singapore'],
		});
		service = srv;
		serviceProvider = sp;
		done();
	});

	afterAll(async (done) => {
		await pgClient.cleanAllTables();
		await pgClient.close();
		done();
	});

	it('Should create a simple event', async () => {
		const oneOffTimeslotRequest = getOneOffTimeslotRequest({ serviceProviderId: serviceProvider.id });
		const event = getEventRequest(
			{ serviceId: service.id, labelIds: [service.labels[0].id, service.categories[0].labels[1].id] },
			[oneOffTimeslotRequest],
		);
		const eventResponse = await populateEvent(event);
		expect(eventResponse.title).toEqual('title');
		expect(eventResponse.description).toEqual('description');
		expect(eventResponse.service.id).toEqual(service.id);
		expect(eventResponse.service.name).toEqual(service.name);
		expect(eventResponse.firstStartDateTime).toEqual(eventResponse.timeslots[0].startDateTime);
		expect(eventResponse.lastEndDateTime).toEqual(eventResponse.timeslots[0].endDateTime);
		expect(eventResponse.labels[0].id).toEqual(service.labels[0].id);
		expect(eventResponse.labels[1].id).toEqual(service.categories[0].labels[1].id);

		expect(new Date(eventResponse.timeslots[0].startDateTime)).toEqual(oneOffTimeslotRequest.startDateTime);
		expect(new Date(eventResponse.timeslots[0].endDateTime)).toEqual(oneOffTimeslotRequest.endDateTime);
		expect(eventResponse.timeslots[0].serviceProvider.name).toEqual(serviceProvider.name);
	});

	it('Should be able to create 2 overlap event with same service Provider', async () => {
		let oneOffTimeslotRequest = getOneOffTimeslotRequest({ serviceProviderId: serviceProvider.id });
		let event = getEventRequest(
			{
				serviceId: service.id,
				labelIds: [
					service.labels[0].id,
					service.categories[0].labels[0].id,
					service.categories[1].labels[0].id,
					service.categories[1].labels[1].id,
					service.categories[2].labels[1].id,
				],
			},
			[oneOffTimeslotRequest],
		);
		await populateEvent(event);

		const endDateTime = new Date(Date.now() + 27 * 60 * 60 * 1000);
		oneOffTimeslotRequest = getOneOffTimeslotRequest({
			serviceProviderId: serviceProvider.id,
			endDateTime,
		});
		getOneOffTimeslotRequest({ serviceProviderId: serviceProvider.id });
		event = getEventRequest({ serviceId: service.id }, [oneOffTimeslotRequest]);
		await populateEvent(event);
	});

	it('should create 20 events with same service and service provider', async () => {
		let x = 1;
		let tempStartDateTime = new Date(Date.now() + 27 * 60 * 60 * 1000);
		let tempEndDateTime = DateHelper.addMinutes(tempStartDateTime, 30);
		while (x < 20) {
			tempStartDateTime = DateHelper.subtractMinutes(tempStartDateTime, 20);
			tempEndDateTime = DateHelper.subtractMinutes(tempEndDateTime, 10);
			let oneOffTimeslotRequest = getOneOffTimeslotRequest({
				serviceProviderId: serviceProvider.id,
				startDateTime: tempStartDateTime,
				endDateTime: tempEndDateTime,
			});
			x = x + 1;
			let event = getEventRequest({ serviceId: service.id }, [oneOffTimeslotRequest]);
			await populateEvent(event);
		}
	});
});
