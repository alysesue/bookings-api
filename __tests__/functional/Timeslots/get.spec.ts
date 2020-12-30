import { PgClient } from '../../utils/pgClient';
import {
    CitizenRequestEndpointSG,
    OrganisationAdminRequestEndpointSG, ServiceAdminRequestEndpointSG, ServiceProviderRequestEndpointSG,
} from '../../utils/requestEndpointSG';
import {
    populateIndividualTimeslot,
    populateServiceAndServiceProvider,
    populateWeeklyTimesheet,
} from '../../Populate/basic';
import {keepTimeFromTimezoneToLocal} from '../../utils/dateTimeUtil';

describe('Timeslots functional tests', () => {
    const pgClient = new PgClient();
    const NAME_SERVICE_1 = 'service1';
    const NAME_SERVICE_2 = 'service2';
    const NAME_SERVICE_3 = 'service3';
    const SERVICE_PROVIDER_NAME_1 = 'SP1';
    const SERVICE_PROVIDER_NAME_2 = 'SP2';
    const SERVICE_PROVIDER_NAME_3 = 'SP3';
    const ORGANISATION = 'localorg';
    const MOL_ADMIN_ID = 'e20a41ba-390f-11eb-adc1-0242ac120002';
    const WEEKDAY = 0;
    const START_TIME_1 = '09:00';
    const END_TIME_1 = '10:00';
    const START_TIME_2 = '11:00';
    const END_TIME_2 = '12:00';
    const START_TIME_3 = '13:00';
    const END_TIME_3 = '14:00';
    const CAPACITY = 2;
    const ERROR_MESSAGE = 'An unexpected error has occurred.';
    const TIME_FORMAT = 'HH:mm';
    let result1;
    let result2;
    let result3;
    let serviceId1;
    let serviceProviderId1;
    let serviceProviderId2;
    let serviceProviderId3;

    beforeAll(async () => {
        await pgClient.cleanAllTables();
    });
    afterAll(async () => {
        await pgClient.close();
    });

    beforeEach(async () => {
        result1 = await populateServiceAndServiceProvider({nameService: NAME_SERVICE_1, serviceProviderName: SERVICE_PROVIDER_NAME_1});
        result2 = await populateServiceAndServiceProvider({nameService: NAME_SERVICE_2, serviceProviderName: SERVICE_PROVIDER_NAME_2});
        result3 = await populateServiceAndServiceProvider({nameService: NAME_SERVICE_3, serviceProviderName: SERVICE_PROVIDER_NAME_3});

        serviceId1 = result1.service.id;

        serviceProviderId1 = result1.serviceProvider.find(item => item.name === SERVICE_PROVIDER_NAME_1).id;
        serviceProviderId2 = result2.serviceProvider.find(item => item.name === SERVICE_PROVIDER_NAME_2).id;
        serviceProviderId3 = result3.serviceProvider.find(item => item.name === SERVICE_PROVIDER_NAME_3).id;

        await populateIndividualTimeslot({serviceProviderId: serviceProviderId1, weekDay: WEEKDAY, startTime: START_TIME_1, endTime: END_TIME_1, capacity: CAPACITY});
        await populateIndividualTimeslot({serviceProviderId: serviceProviderId2, weekDay: WEEKDAY, startTime: START_TIME_2, endTime: END_TIME_2, capacity: CAPACITY});
        await populateIndividualTimeslot({serviceProviderId: serviceProviderId3, weekDay: WEEKDAY, startTime: START_TIME_3, endTime: END_TIME_3, capacity: CAPACITY});

        await populateWeeklyTimesheet({serviceProviderId: serviceProviderId1, openTime: START_TIME_1, closeTime: END_TIME_1, scheduleSlot: 60});
    });

    afterEach(async () => {
        await pgClient.cleanAllTables();
    });

    it('organisation admin should get all timeslot schedules', async () => {
        const service1TimeslotsResponse = await OrganisationAdminRequestEndpointSG.create({}).get(`/service-providers/${serviceProviderId1}/timeslotSchedule`);
        const service2TimeslotsResponse = await OrganisationAdminRequestEndpointSG.create({}).get(`/service-providers/${serviceProviderId2}/timeslotSchedule`);
        const service3TimeslotsResponse = await OrganisationAdminRequestEndpointSG.create({}).get(`/service-providers/${serviceProviderId3}/timeslotSchedule`);

        expect(service1TimeslotsResponse.statusCode).toEqual(200);
        expect(JSON.parse(service1TimeslotsResponse.body).data.timeslots[0].startTime).toEqual(START_TIME_1);
        expect(JSON.parse(service1TimeslotsResponse.body).data.timeslots[0].endTime).toEqual(END_TIME_1);

        expect(service2TimeslotsResponse.statusCode).toEqual(200);
        expect(JSON.parse(service2TimeslotsResponse.body).data.timeslots[0].startTime).toEqual(START_TIME_2);
        expect(JSON.parse(service2TimeslotsResponse.body).data.timeslots[0].endTime).toEqual(END_TIME_2);

        expect(service3TimeslotsResponse.statusCode).toEqual(200);
        expect(JSON.parse(service3TimeslotsResponse.body).data.timeslots[0].startTime).toEqual(START_TIME_3);
        expect(JSON.parse(service3TimeslotsResponse.body).data.timeslots[0].endTime).toEqual(END_TIME_3);
    });

    it('organization admin should get all timeslot schedules for specific service provider', async () => {
        const timeslotsForServiceProviders = await OrganisationAdminRequestEndpointSG.create({serviceId: serviceId1}).get(`timeslots?startDate=2020-11-27T09:00:00.000Z&endDate=2020-11-30T09:59:59.999Z&includeBookings=true`);

        expect(timeslotsForServiceProviders.statusCode).toEqual(200);

        const startDate = JSON.parse(timeslotsForServiceProviders.body).data[0].startTime;
        const endDate = JSON.parse(timeslotsForServiceProviders.body).data[0].endTime;

        const startTime = keepTimeFromTimezoneToLocal({date: startDate, format: TIME_FORMAT });
        const endTime = keepTimeFromTimezoneToLocal({date: endDate, format: TIME_FORMAT})
        expect(startTime).toEqual(START_TIME_1);
        expect(endTime).toEqual(END_TIME_1);
    });

    it('service admin should only get timeslot schedules for their service', async() => {
        await pgClient.mapServiceAdminToService({serviceId: result1.service.id, nameService: NAME_SERVICE_1, organisation: ORGANISATION});

        const service1TimeslotsResponse = await ServiceAdminRequestEndpointSG.create({nameService: NAME_SERVICE_1, serviceId: result1.service.id}).get(`/service-providers/${serviceProviderId1}/timeslotSchedule`);
        expect(service1TimeslotsResponse.statusCode).toEqual(200);
        expect(JSON.parse(service1TimeslotsResponse.body).data.timeslots[0].startTime).toEqual(START_TIME_1);
        expect(JSON.parse(service1TimeslotsResponse.body).data.timeslots[0].endTime).toEqual(END_TIME_1);

        try {
            await ServiceAdminRequestEndpointSG.create({nameService: NAME_SERVICE_1, serviceId: result1.service.id}).get(`/service-providers/${serviceProviderId2}/timeslotSchedule`);
            await ServiceAdminRequestEndpointSG.create({nameService: NAME_SERVICE_1, serviceId: result1.service.id}).get(`/service-providers/${serviceProviderId3}/timeslotSchedule`);
        } catch (e) {
            expect(e.message).toBe(ERROR_MESSAGE);
        }
    });

    it('service provider should only get their timeslot schedule', async() => {
        await pgClient.mapServiceProviderToAdminId({serviceProviderId: serviceProviderId1, molAdminId: MOL_ADMIN_ID});

        const service1TimeslotsResponse = await ServiceProviderRequestEndpointSG.create({nameService: NAME_SERVICE_1, serviceId: result1.service.id}).get(`/service-providers/${serviceProviderId1}/timeslotSchedule`);
        expect(service1TimeslotsResponse.statusCode).toEqual(200);
        expect(JSON.parse(service1TimeslotsResponse.body).data.timeslots[0].startTime).toEqual(START_TIME_1);
        expect(JSON.parse(service1TimeslotsResponse.body).data.timeslots[0].endTime).toEqual(END_TIME_1);

        try {
            await ServiceProviderRequestEndpointSG.create({nameService: NAME_SERVICE_1, serviceId: result1.service.id}).get(`/service-providers/${serviceProviderId2}/timeslotSchedule`);
            await ServiceProviderRequestEndpointSG.create({nameService: NAME_SERVICE_1, serviceId: result1.service.id}).get(`/service-providers/${serviceProviderId3}/timeslotSchedule`);
        } catch (e) {
            expect(e.message).toBe(ERROR_MESSAGE);
        }
    });

    it('citizen should not get any timeslot schedules', async() => {
        try {
            await CitizenRequestEndpointSG.create({serviceId: result1.service.id}).get(`/service-providers/${serviceProviderId1}/timeslotSchedule`);
            await CitizenRequestEndpointSG.create({serviceId: result2.service.id}).get(`/service-providers/${serviceProviderId2}/timeslotSchedule`);
            await CitizenRequestEndpointSG.create({serviceId: result3.service.id}).get(`/service-providers/${serviceProviderId3}/timeslotSchedule`);
        } catch(e) {
            expect(e.message).toBe(ERROR_MESSAGE);
        }
    });
});
