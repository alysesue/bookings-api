import { PgClient } from '../../../utils/pgClient';
import {
	AgencyRequestEndpointSG,
	AnonmymousEndpointSG,
	CitizenRequestEndpointSG,
	OrganisationAdminRequestEndpointSG,
	ServiceAdminRequestEndpointSG,
} from '../../../utils/requestEndpointSG';
import * as request from 'request';
import { BookingStatus, BookingWorkflowType } from '../../../../src/models';
import {
	DynamicValueTypeContract,
	PersistDynamicValueContract,
} from '../../../../src/components/dynamicFields/dynamicValues.apicontract';
import { IdHasherForFunctional } from '../../../utils/idHashingUtil';
import { ServiceProviderResponseModelV1 } from '../../../../src/components/serviceProviders/serviceProviders.apicontract';
import { ServiceResponseV1 } from '../../../../src/components/services/service.apicontract';
import { BookingRequestV1, BookingResponseV1 } from '../../../../src/components/bookings/bookings.apicontract';
import { BookingChangeLogResponseV1 } from '../../../../src/components/bookingChangeLogs/bookingChangeLogs.apicontract';
import { populateUserServiceProvider } from '../../../populate/V1/users';
import { populateWeeklyTimesheet, setServiceProviderAutoAssigned } from '../../../populate/V1/serviceProviders';
import { populateOutOfSlotBooking } from '../../../populate/V1/bookings';

// tslint:disable-next-line: no-big-function
describe('Bookings functional tests', () => {
	const pgClient = new PgClient();
	const NAME_SERVICE_1 = 'service1';
	const SERVICE_PROVIDER_NAME_1 = 'SP1';
	const START_TIME_1 = '09:00';
	const END_TIME_1 = '12:00';

	const citizenUinFin = 'S7429377H';
	const citizenName = 'Jane';
	const citizenEmail = 'jane@email.com';

	let serviceProvider: ServiceProviderResponseModelV1;
	let service: ServiceResponseV1;
	let serviceId: number;
	let serviceIdStr: string;

	let dynamicFieldId;

	const options = [
		{
			key: 1,
			value: 'option A',
		},
		{
			key: 2,
			value: 'option B',
		},
	];

	const today = new Date();

	const getDateFromToday = ({ addDays, hours, minutes }: { addDays: number; hours: number; minutes: number }) => {
		return new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() + addDays, hours, minutes));
	};

	beforeEach(async () => {
		await pgClient.cleanAllTables();

		const result = await populateUserServiceProvider({
			serviceNames: [NAME_SERVICE_1],
			name: SERVICE_PROVIDER_NAME_1,
			agencyUserId: 'A001',
		});
		serviceProvider = result.serviceProviders.find((item) => item.name === SERVICE_PROVIDER_NAME_1);

		service = result.services.find((item) => item.name === NAME_SERVICE_1);
		serviceId = service.id;
		serviceIdStr = `${serviceId}`;

		await populateWeeklyTimesheet({
			serviceProviderId: serviceProvider.id,
			openTime: START_TIME_1,
			closeTime: END_TIME_1,
			scheduleSlot: 60,
		});

		const queryResult = await pgClient.mapDynamicFields({
			type: 'SelectListDynamicField',
			serviceId,
			name: 'Select an option',
			options: JSON.stringify(options),
		});

		const idHasher = new IdHasherForFunctional();
		dynamicFieldId = await idHasher.convertIdToHash(queryResult.rows[0]._id);
	});

	afterAll(async () => {
		await pgClient.cleanAllTables();
		await pgClient.close();
	});

	const postAdminBookingWithStartEndTimeOnly = async (
		isOnHold: boolean,
		isStandAlone: boolean,
		serviceProviderId?: number,
	): Promise<request.Response> => {
		await pgClient.setServiceConfigurationOnHold(serviceId, isOnHold);
		await pgClient.setServiceConfigurationStandAlone(serviceId, isStandAlone);

		const startDateTime = new Date(Date.UTC(2051, 11, 10, 1, 0));
		const endDateTime = new Date(Date.UTC(2051, 11, 10, 2, 0));

		const endpoint = ServiceAdminRequestEndpointSG.create({
			nameService: NAME_SERVICE_1,
			serviceId: serviceIdStr,
		});
		return await endpoint.post('/bookings', {
			body: {
				startDateTime,
				endDateTime,
				serviceProviderId: serviceProviderId || undefined,
			},
		});
	};

	const postCitizenBookingWithStartEndDateOnly = async (
		isOnHold: boolean,
		isStandAlone: boolean,
		serviceProviderId?: number,
		start?: Date,
		end?: Date,
	): Promise<request.Response> => {
		await pgClient.setServiceConfigurationOnHold(serviceId, isOnHold);
		await pgClient.setServiceConfigurationStandAlone(serviceId, isStandAlone);

		const startDateTime = start ?? new Date(Date.UTC(2051, 11, 10, 1, 0));
		const endDateTime = end ?? new Date(Date.UTC(2051, 11, 10, 2, 0));

		const endpoint = CitizenRequestEndpointSG.create({
			citizenUinFin,
			serviceId: serviceIdStr,
		});
		return await endpoint.post('/bookings', {
			body: {
				startDateTime,
				endDateTime,
				serviceProviderId: serviceProviderId || undefined,
			},
		});
	};

	const postAnonymousBooking = async (
		params: Partial<BookingRequestV1> = {},
		verifyOTP: boolean = false,
		validate: boolean = false,
		reschedule: boolean = false,
	) => {
		const startDateTime = new Date(Date.UTC(2051, 11, 10, 1, 0));
		const endDateTime = new Date(Date.UTC(2051, 11, 10, 2, 0));

		const endpoint = await AnonmymousEndpointSG.create({
			serviceId: serviceIdStr,
		});

		if (verifyOTP) await endpoint.sendAndVerifyOTP();

		const bookingResponse = await endpoint.post('/bookings', {
			body: {
				startDateTime,
				endDateTime,
				serviceProviderId: serviceProvider.id,
				citizenUinFin,
				citizenName,
				citizenEmail,
				...params,
			},
		});

		if (!validate) return bookingResponse;

		const bookingId = bookingResponse.body.data.id;
		const validateResponse = await endpoint.post(`/bookings/${bookingId}/validateOnHold`, {
			body: {
				citizenUinFin,
				citizenName,
				citizenEmail,
				citizenPhone: '98728473',
			},
		});

		if (reschedule) return postAnonymousRescheduleBooking(endpoint, bookingId);
		return [bookingResponse, validateResponse];
	};

	const postAnonymousRescheduleBooking = async (endpoint, bookingId) => {
		return await endpoint.post(`/bookings/${bookingId}/reschedule`, {
			body: {
				startDateTime: new Date(Date.UTC(2051, 11, 10, 3, 0)),
				endDateTime: new Date(Date.UTC(2051, 11, 10, 4, 0)),
				serviceProviderId: serviceProvider.id,
				citizenName,
				citizenEmail,
			},
		});
	};

	const postCitizenInSlotBookingWithoutServiceProviderId = async (): Promise<request.Response> => {
		const startDateTime = new Date(Date.UTC(2051, 11, 10, 1, 0));
		const endDateTime = new Date(Date.UTC(2051, 11, 10, 2, 0));

		const endpoint = CitizenRequestEndpointSG.create({
			citizenUinFin,
			serviceId: serviceIdStr,
		});
		return await endpoint.post('/bookings', {
			body: {
				startDateTime,
				endDateTime,
				citizenName,
				citizenEmail,
			},
		});
	};

	const postCitizenBookingWithDynamicFields = async (): Promise<request.Response> => {
		const startDateTime = new Date(Date.UTC(2051, 11, 10, 1, 0));
		const endDateTime = new Date(Date.UTC(2051, 11, 10, 2, 0));

		const dynamicValue = new PersistDynamicValueContract();
		dynamicValue.singleSelectionKey = 1;
		dynamicValue.fieldIdSigned = dynamicFieldId;
		dynamicValue.type = 'SingleSelection' as DynamicValueTypeContract;

		const endpoint = CitizenRequestEndpointSG.create({
			citizenUinFin,
			serviceId: serviceIdStr,
		});
		return await endpoint.post('/bookings', {
			body: {
				startDateTime,
				endDateTime,
				citizenName,
				citizenEmail,
				dynamicValuesUpdated: true,
				dynamicValues: [dynamicValue],
			},
		});
	};

	const postCitizenBookingWithVideoConferenceURL = async (): Promise<request.Response> => {
		const startDateTime = new Date(Date.UTC(2051, 11, 10, 1, 0));
		const endDateTime = new Date(Date.UTC(2051, 11, 10, 2, 0));
		const videoConferenceUrl = 'http://www.zoom.us/1234567';

		const endpoint = CitizenRequestEndpointSG.create({
			citizenUinFin,
			serviceId: serviceIdStr,
		});
		return await endpoint.post('/bookings', {
			body: {
				startDateTime,
				endDateTime,
				citizenName,
				citizenEmail,
				videoConferenceUrl,
			},
		});
	};

	const getChangeLogs = async (params: {
		changedSince: Date;
		changedUntil: Date;
		bookingIds?: number[];
	}): Promise<request.Response> => {
		const endpoint = OrganisationAdminRequestEndpointSG.create({
			serviceId: `${serviceId}`,
		});

		return await endpoint.get('/bookinglogs', { params });
	};

	const postCitizenInSlotServiceProviderBooking = async (): Promise<request.Response> => {
		const startDateTime = new Date(Date.UTC(2051, 11, 10, 1, 0));
		const endDateTime = new Date(Date.UTC(2051, 11, 10, 2, 0));

		const endpoint = CitizenRequestEndpointSG.create({
			citizenUinFin,
			serviceId: serviceIdStr,
		});
		return await endpoint.post('/bookings', {
			body: {
				startDateTime,
				endDateTime,
				serviceProviderId: serviceProvider.id,
				citizenName,
				citizenEmail,
			},
		});
	};

	const postCitizenReschedule = async (bookingId: number): Promise<request.Response> => {
		const startDateTime = new Date(Date.UTC(2051, 11, 10, 3, 0));
		const endDateTime = new Date(Date.UTC(2051, 11, 10, 4, 0));

		const endpoint = CitizenRequestEndpointSG.create({
			citizenUinFin,
			serviceId: serviceIdStr,
		});

		return await endpoint.post(`/bookings/${bookingId}/reschedule`, {
			body: {
				startDateTime,
				endDateTime,
				serviceProviderId: serviceProvider.id,
				citizenName,
				citizenEmail,
			},
		});
	};

	it('should make a booking with default video conference URL', async () => {
		await OrganisationAdminRequestEndpointSG.create({}).put(`/services/${serviceId}`, {
			body: { name: NAME_SERVICE_1, videoConferenceUrl: 'http://www.zoom.us/7654321' },
		});
		const response = await postCitizenBookingWithStartEndDateOnly(true, false);
		expect(response.statusCode).toEqual(201);
		const booking = response.body.data as BookingResponseV1;
		expect(booking.videoConferenceUrl).toEqual('http://www.zoom.us/7654321');
	});

	it('should make a booking with OA/SA supplied video conference URL', async () => {
		await OrganisationAdminRequestEndpointSG.create({}).put(`/services/${serviceId}`, {
			body: { name: NAME_SERVICE_1, videoConferenceUrl: 'http://www.zoom.us/7654321' },
		});
		const response = await postCitizenBookingWithVideoConferenceURL();
		expect(response.statusCode).toEqual(201);
		const booking = response.body.data as BookingResponseV1;
		expect(booking.videoConferenceUrl).toEqual('http://www.zoom.us/1234567');
	});

	it('should make a booking with dynamic values', async () => {
		const response = await postCitizenBookingWithDynamicFields();
		expect(response.statusCode).toEqual(201);
		const booking = response.body.data as BookingResponseV1;
		expect(booking?.dynamicValues?.length).toEqual(1);
		expect(booking.dynamicValues[0].fieldIdSigned).toEqual(dynamicFieldId);
	});

	it('should create a booking log with dynamic values', async () => {
		const response = await postCitizenBookingWithDynamicFields();
		expect(response.statusCode).toEqual(201);
		const booking = response.body.data as BookingResponseV1;

		const changedUntil = new Date(new Date(booking.createdDateTime).getTime() + 1000 * 60);
		const changeLogResponse = await getChangeLogs({
			changedSince: booking.createdDateTime,
			changedUntil,
			bookingIds: [booking.id],
		});
		expect(changeLogResponse.statusCode).toEqual(200);

		const changeLogs = changeLogResponse.body.data as BookingChangeLogResponseV1[];
		expect(changeLogs.length).toEqual(1);
		expect(changeLogs[0]).toEqual({
			bookingId: booking.id,
			changeLogs: [
				{
					action: 'create',
					changes: {
						citizenEmail: 'jane@email.com',
						citizenName: 'Jane',
						citizenUinFin: 'S7429377H',
						citizenPhone: null,
						description: null,
						location: null,
						refId: null,
						dynamicValues: [
							{
								fieldIdSigned: dynamicFieldId,
								fieldName: 'Select an option',
								singleSelectionKey: 1,
								singleSelectionValue: 'option A',
								type: 'SingleSelection',
							},
						],
						startDateTime: '2051-12-10T01:00:00.000Z',
						endDateTime: '2051-12-10T02:00:00.000Z',
						id: booking.id,
						serviceId,
						serviceName: 'service1',
						status: 1,
						videoConferenceUrl: null,
						bookedSlots: [],
					},
					previousBooking: {
						schemaVersion: 1,
					},
					timestamp: booking.createdDateTime,
					user: {
						singpass: {
							uinfin: 'S7429377H',
						},
						userType: 'singpass',
					},
				},
			],
		});
	});

	it('Citizen should make a booking when days in advance is setup', async () => {
		await OrganisationAdminRequestEndpointSG.create({}).put(`/services/${serviceIdStr}`, {
			body: { name: service.name, minDaysInAdvance: 7, maxDaysInAdvance: 15 },
		});

		const start = getDateFromToday({ addDays: 8, hours: 1, minutes: 0 });
		const end = getDateFromToday({ addDays: 8, hours: 2, minutes: 0 });

		const response = await postCitizenBookingWithStartEndDateOnly(false, true, undefined, start, end);
		expect(response.statusCode).toBe(201);
		expect(response.body).toBeDefined();
		expect(response.body.data.status).toBe(BookingStatus.OnHold);
	});

	it(`Citizen should NOT make a booking when days in advance is setup and dates don't match (lower limit)`, async () => {
		await OrganisationAdminRequestEndpointSG.create({}).put(`/services/${serviceIdStr}`, {
			body: { name: service.name, minDaysInAdvance: 7, maxDaysInAdvance: 15 },
		});

		const start = getDateFromToday({ addDays: 0, hours: 1, minutes: 0 });
		const end = getDateFromToday({ addDays: 0, hours: 2, minutes: 0 });

		const response = await postCitizenBookingWithStartEndDateOnly(false, true, undefined, start, end);
		expect(response.statusCode).toBe(400);
		expect(response.body).toBeDefined();
		expect(response.body.data).toEqual([
			{ code: '10002', message: 'No available service providers in the selected time range' },
		]);
	});

	it(`Citizen should NOT make a booking when days in advance is setup and dates don't match (upper limit)`, async () => {
		await OrganisationAdminRequestEndpointSG.create({}).put(`/services/${serviceIdStr}`, {
			body: { name: service.name, minDaysInAdvance: 7, maxDaysInAdvance: 15 },
		});

		const start = getDateFromToday({ addDays: 16, hours: 1, minutes: 0 });
		const end = getDateFromToday({ addDays: 16, hours: 2, minutes: 0 });

		const response = await postCitizenBookingWithStartEndDateOnly(false, true, undefined, start, end);
		expect(response.statusCode).toBe(400);
		expect(response.body).toBeDefined();
		expect(response.body.data).toEqual([
			{ code: '10002', message: 'No available service providers in the selected time range' },
		]);
	});

	it('[On hold] Agency should validate SERVICE on hold booking', async () => {
		const response = await postCitizenBookingWithStartEndDateOnly(true, false);
		const bookingId = response.body.data.id;

		const adminValidateOnHoldResponse = await AgencyRequestEndpointSG.create({}).post(
			`/bookings/${bookingId}/validateOnHold`,
			{
				body: {
					citizenName,
					citizenEmail,
					citizenUinFin,
				},
			},
		);

		expect(adminValidateOnHoldResponse.statusCode).toEqual(200);
		expect(adminValidateOnHoldResponse.body.data.status).toEqual(BookingStatus.PendingApproval);
	});

	it('[On hold] Agency should validate SERVICE PROVIDER on hold booking', async () => {
		const response = await postCitizenBookingWithStartEndDateOnly(true, false, serviceProvider.id);
		const bookingId = response.body.data.id;

		const adminValidateOnHoldResponse = await AgencyRequestEndpointSG.create({}).post(
			`/bookings/${bookingId}/validateOnHold`,
			{
				body: {
					citizenName,
					citizenEmail,
					citizenUinFin,
				},
			},
		);

		expect(adminValidateOnHoldResponse.statusCode).toEqual(200);
		expect(adminValidateOnHoldResponse.body.data.status).toEqual(BookingStatus.Accepted);
	});

	it('[On hold] Admin should NOT make a SERVICE on hold booking when on hold flag is true', async () => {
		const response = await postAdminBookingWithStartEndTimeOnly(true, false);
		expect(response.statusCode).toBe(400);
	});

	it('[On hold] Admin should NOT make a SERVICE PROVIDER on hold booking when on hold flag is true', async () => {
		const response = await postAdminBookingWithStartEndTimeOnly(true, false, serviceProvider.id);
		expect(response.statusCode).toBe(400);
	});

	it('[Stand alone] Citizen should make a stand alone SERVICE booking when stand alone flag is true', async () => {
		const response = await postCitizenBookingWithStartEndDateOnly(false, true);
		expect(response.statusCode).toBe(201);
		expect(response.body).toBeDefined();
		expect(response.body.data.status).toBe(BookingStatus.OnHold);
	});

	it('[Stand alone] Citizen should make a stand alone SERVICE PROVIDER booking when stand alone flag is true', async () => {
		const response = await postCitizenBookingWithStartEndDateOnly(false, true, serviceProvider.id);
		expect(response.statusCode).toBe(201);
		expect(response.body).toBeDefined();
		expect(response.body.data.status).toBe(BookingStatus.OnHold);
	});

	const citizenMakeStandAloneBookingAndValidate = async (): Promise<{
		onHoldResponse: request.Response;
		validateResponse: request.Response;
	}> => {
		const onHoldResponse = await postCitizenBookingWithStartEndDateOnly(false, true, serviceProvider.id);
		const bookingId = onHoldResponse.body.data.id;
		const validateResponse = await CitizenRequestEndpointSG.create({}).post(
			`/bookings/${bookingId}/validateOnHold`,
			{
				body: {
					citizenName,
					citizenEmail,
					citizenUinFin,
				},
			},
		);
		return {
			onHoldResponse,
			validateResponse,
		};
	};

	const citizenRescheduleStandAloneAndValidate = async (
		bookingId: number,
	): Promise<{
		onHoldReschedule: request.Response;
		bookingBeforeValidate: request.Response;
		validateReschedule: request.Response;
	}> => {
		await pgClient.setServiceConfigurationStandAlone(serviceId, true);
		const startDateTime = new Date(Date.UTC(2051, 11, 10, 3, 0));
		const endDateTime = new Date(Date.UTC(2051, 11, 10, 4, 0));

		const endpoint = CitizenRequestEndpointSG.create({
			citizenUinFin,
			serviceId: serviceIdStr,
		});

		const onHoldReschedule = await endpoint.post(`/bookings/${bookingId}/reschedule`, {
			body: {
				startDateTime,
				endDateTime,
				serviceProviderId: serviceProvider.id,
				citizenName,
				citizenEmail,
			},
		});

		const bookingBeforeValidate = await endpoint.get(`/bookings/${bookingId}`, {});

		const onHoldRescheduleId = onHoldReschedule.body.data.id;
		const validateReschedule = await CitizenRequestEndpointSG.create({}).post(
			`/bookings/${onHoldRescheduleId}/validateOnHold`,
			{
				body: {
					citizenName,
					citizenEmail,
					citizenUinFin,
				},
			},
		);
		return {
			onHoldReschedule,
			bookingBeforeValidate,
			validateReschedule,
		};
	};

	it('[Stand alone] Citizen should make a stand alone SERVICE PROVIDER booking, validate and reschedule', async () => {
		const { onHoldResponse, validateResponse } = await citizenMakeStandAloneBookingAndValidate();
		const validatedBookingId = validateResponse.body.data.id;
		expect(onHoldResponse.statusCode).toBe(201);
		expect(onHoldResponse.body.data.status).toBe(BookingStatus.OnHold);
		expect(validateResponse.statusCode).toBe(200);
		expect(validateResponse.body.data.status).toBe(BookingStatus.Accepted);
		expect(validatedBookingId).toBeDefined();

		const {
			onHoldReschedule,
			bookingBeforeValidate,
			validateReschedule,
		} = await citizenRescheduleStandAloneAndValidate(validatedBookingId);

		//makes sure original booking hasn't changed yet (before Reschedule standalone validation)
		expect(bookingBeforeValidate.body.data.startDateTime).toEqual('2051-12-10T01:00:00.000Z');
		expect(bookingBeforeValidate.body.data.endDateTime).toEqual('2051-12-10T02:00:00.000Z');
		expect(bookingBeforeValidate.body.data.status).toBe(BookingStatus.Accepted);

		expect(onHoldReschedule.statusCode).toBe(200);
		expect(onHoldReschedule.body.data.status).toBe(BookingStatus.OnHold);
		expect(validateReschedule.statusCode).toBe(200);
		expect(validateReschedule.body.data.status).toBe(BookingStatus.Accepted);
		//Booking id should be the same, after validation, even though there's a temporary on hold booking.
		expect(validateReschedule.body.data.id).toEqual(validatedBookingId);
		expect(validateReschedule.body.data.startDateTime).toEqual('2051-12-10T03:00:00.000Z');
		expect(validateReschedule.body.data.endDateTime).toEqual('2051-12-10T04:00:00.000Z');
	});

	it('[Stand alone] Admin should NOT make a SERVICE stand alone booking when stand alone flag is true', async () => {
		const response = await postAdminBookingWithStartEndTimeOnly(false, true);
		expect(response.statusCode).toBe(400);
	});

	it('[Stand alone] Admin should NOT make a SERVICE PROVIDER stand alone booking when stand alone flag is true', async () => {
		const response = await postAdminBookingWithStartEndTimeOnly(false, true, serviceProvider.id);
		expect(response.statusCode).toBe(400);
	});

	it('[On hold & Stand alone] Citizen should make an on hold SERVICE booking when on hold and stand alone flag is true', async () => {
		const response = await postCitizenBookingWithStartEndDateOnly(true, true);
		expect(response.statusCode).toBe(201);
		expect(response.body).toBeDefined();
		expect(response.body.data.status).toBe(BookingStatus.OnHold);
	});

	it('[Auto Assign] service provider should be auto assigned if spAutoAssigned flag is true', async () => {
		const service = await setServiceProviderAutoAssigned({
			nameService: NAME_SERVICE_1,
			serviceId,
			isSpAutoAssigned: true,
		});
		expect(service.isSpAutoAssigned).toBe(true);

		const response = await postCitizenInSlotBookingWithoutServiceProviderId();
		expect(response.statusCode).toBe(201);
		expect(response.body.data.id).toBeGreaterThan(0);
		expect(response.body.data.serviceProviderAgencyUserId).toBe('A001');
		expect(response.body.data.serviceId).toBe(serviceId);
	});

	it('admin should create out of slot booking and citizen cancels a booking', async () => {
		const startDateTime = new Date(Date.UTC(2051, 11, 10, 0, 0));
		const endDateTime = new Date(Date.UTC(2051, 11, 10, 1, 0));

		const bookingId = await populateOutOfSlotBooking({
			startDateTime,
			endDateTime,
			serviceId,
			serviceProviderId: serviceProvider.id,
			citizenUinFin,
			citizenName,
			citizenEmail,
		});
		const citizenCancelBookingResponse = await CitizenRequestEndpointSG.create({}).post(
			`/bookings/${bookingId}/cancel`,
			{},
		);
		expect(citizenCancelBookingResponse.statusCode).toEqual(204);
	});

	it('should NOT create out-of-slot booking as a citizen', async () => {
		const startDateTime = new Date(Date.UTC(2051, 11, 10, 0, 0));
		const endDateTime = new Date(Date.UTC(2051, 11, 10, 1, 0));

		const endpoint = CitizenRequestEndpointSG.create({
			citizenUinFin,
			serviceId: serviceIdStr,
		});

		const response = await endpoint.post('/bookings', {
			body: {
				startDateTime,
				endDateTime,
				serviceProviderId: serviceProvider.id,
				citizenName,
				citizenEmail,
			},
		});

		expect(response.body.data[0].code).toBe('10001');
		expect(response.body.data[0].message).toBe('The service provider is not available in the selected time range');
	});

	it('[Auto Accept] should create in-slot booking as a citizen', async () => {
		const response = await postCitizenInSlotServiceProviderBooking();
		expect(response.statusCode).toBe(201);
		expect(response.body).toBeDefined();
		expect(response.body.data.id).toBeDefined();
		expect(response.body.data.status).toBe(BookingStatus.Accepted);
	});

	it('[Auto Accept] should reschedule in-slot booking as a citizen', async () => {
		const bookingResponse = await postCitizenInSlotServiceProviderBooking();
		const bookingId = bookingResponse.body.data.id;
		const response = await postCitizenReschedule(bookingId);

		expect(response.statusCode).toBe(200);
		expect(response.body.data.status).toBe(BookingStatus.Accepted);
	});

	it('[Pending approval] should create in-slot booking as a citizen', async () => {
		await pgClient.setServiceProviderAutoAccept({
			serviceProviderId: serviceProvider.id,
			autoAcceptBookings: false,
		});
		const response = await postCitizenInSlotServiceProviderBooking();
		expect(response.statusCode).toBe(201);
		expect(response.body).toBeDefined();
		expect(response.body.data.id).toBeDefined();
		expect(response.body.data.status).toBe(BookingStatus.PendingApproval);
	});

	it('[Pending approval] should reschedule in-slot booking as a citizen', async () => {
		await pgClient.setServiceProviderAutoAccept({
			serviceProviderId: serviceProvider.id,
			autoAcceptBookings: false,
		});
		const bookingResponse = await postCitizenInSlotServiceProviderBooking();
		const bookingId = bookingResponse.body.data.id;
		const response = await postCitizenReschedule(bookingId);

		expect(response.statusCode).toBe(200);
		expect(response.body.data.status).toBe(BookingStatus.PendingApproval);
	});

	it('[Pending approval - change after booking] should reschedule in-slot booking as a citizen', async () => {
		const bookingResponse = await postCitizenInSlotServiceProviderBooking();
		const bookingId = bookingResponse.body.data.id;

		await pgClient.setServiceProviderAutoAccept({
			serviceProviderId: serviceProvider.id,
			autoAcceptBookings: false,
		});
		const response = await postCitizenReschedule(bookingId);

		expect(response.statusCode).toBe(200);
		expect(response.body.data.status).toBe(BookingStatus.PendingApproval);
	});

	it('should NOT create in-slot booking as anonymous (when status is not OnHold)', async () => {
		await pgClient.configureServiceAllowAnonymous({ serviceId });

		const bookingResponse = await postAnonymousBooking();
		expect(bookingResponse.statusCode).toBe(403);
	});

	it('should create in-slot booking as anonymous (when status is OnHold)', async () => {
		const bookingResponse = await postAnonymousBooking({
			workflowType: BookingWorkflowType.OnHold,
		});
		expect(bookingResponse.statusCode).toBe(201);
	});

	it('should create in-slot booking as anonymous (when status is NOT OnHold, but is user is OTP verified)', async () => {
		await pgClient.configureServiceAllowAnonymous({ serviceId });

		const bookingResponse = await postAnonymousBooking({}, true);
		expect(bookingResponse.statusCode).toBe(201);
	});

	it('should NOT create in-slot booking as anonymous if service is not setup (when status is NOT OnHold, but is user is OTP verified)', async () => {
		const bookingResponse = await postAnonymousBooking({}, true);
		expect(bookingResponse.statusCode).toBe(403);
	});

	it('should create standalone booking as an Anonymous user (when service is configured)', async () => {
		await pgClient.configureServiceAllowAnonymous({ serviceId });
		await pgClient.setServiceConfigurationStandAlone(serviceId, true);

		const [bookingResponse, validateResponse] = await postAnonymousBooking({}, true, true);

		expect(bookingResponse.statusCode).toBe(201);
		expect(validateResponse.statusCode).toBe(200);
	});

	it('should NOT create standalone booking as an Anonymous user without OTP verification', async () => {
		await pgClient.configureServiceAllowAnonymous({ serviceId });
		await pgClient.setServiceConfigurationStandAlone(serviceId, true);

		// without otp
		const [bookingResponse, validateResponse] = await postAnonymousBooking({}, false, true);

		expect(bookingResponse.statusCode).toBe(201);
		expect(validateResponse.statusCode).toBe(401);
	});

	it('should NOT create standalone booking as an Anonymous user (when service is NOT configured)', async () => {
		await pgClient.setServiceConfigurationStandAlone(serviceId, true);

		const [bookingResponse, validateResponse] = await postAnonymousBooking({}, true, true);

		expect(bookingResponse.statusCode).toBe(201);
		expect(validateResponse.statusCode).toBe(403);
	});

	it('[Stand alone][Anonymous] - should reschedule booking as anonymous', async () => {
		await pgClient.setServiceConfigurationStandAlone(serviceId, true);

		const response = await postAnonymousBooking({}, true, true, true);

		expect(response.statusCode).toBe(200);
		expect(response.body.data.status).toBe(BookingStatus.OnHold);
		expect(response.body.data.citizenUinFin).toEqual('S****377H');
	});

	it('should create multiple bookings', async () => {
		const startDateTime_1 = new Date(Date.UTC(2051, 11, 10, 1, 0));
		const endDateTime_1 = new Date(Date.UTC(2051, 11, 10, 2, 0));

		const startDateTime_2 = new Date(Date.UTC(2051, 11, 10, 10, 0));
		const endDateTime_2 = new Date(Date.UTC(2051, 11, 10, 11, 0));

		const endpoint = OrganisationAdminRequestEndpointSG.create({
			serviceId: serviceIdStr,
		});

		const response = await endpoint.post('/bookings/bulk', {
			body: [
				{
					startDateTime: startDateTime_1,
					endDateTime: endDateTime_1,
					serviceProviderId: serviceProvider.id,
					citizenUinFin,
					citizenName,
					citizenEmail,
				},
				{
					startDateTime: startDateTime_2,
					endDateTime: endDateTime_2,
					serviceProviderId: serviceProvider.id,
					citizenUinFin,
					citizenName,
					citizenEmail,
				},
			],
		});

		expect(response.statusCode).toEqual(201);
		expect(response.body.data.created.length).toEqual(2);
	});

	it('should accept a booking', async () => {
		await pgClient.setServiceProviderAutoAccept({
			serviceProviderId: serviceProvider.id,
			autoAcceptBookings: false,
		});
		const response = await postCitizenInSlotServiceProviderBooking();
		const bookingId = response.body.data.id;

		expect(response.statusCode).toBe(201);
		expect(response.body).toBeDefined();
		expect(bookingId).toBeDefined();
		expect(response.body.data.status).toBe(BookingStatus.PendingApproval);
		expect(response.body.data.serviceProviderId).toEqual(serviceProvider.id);

		const endpoint = await OrganisationAdminRequestEndpointSG.create({ serviceId: serviceIdStr });
		const postResponse = await endpoint.post(`/bookings/${bookingId}/accept`, {
			body: { serviceProviderId: serviceProvider.id },
		});
		expect(postResponse.statusCode).toBe(204);

		const getResponse = await endpoint.get(`/bookings/${bookingId}`);
		expect(getResponse.statusCode).toBe(200);
		expect(getResponse.body).toBeDefined();
		expect(getResponse.body.data.status).toBe(BookingStatus.Accepted);
	});

	it('should reject a booking', async () => {
		await pgClient.setServiceProviderAutoAccept({
			serviceProviderId: serviceProvider.id,
			autoAcceptBookings: false,
		});
		const response = await postCitizenInSlotServiceProviderBooking();
		const bookingId = response.body.data.id;

		expect(response.statusCode).toBe(201);
		expect(response.body).toBeDefined();
		expect(bookingId).toBeDefined();
		expect(response.body.data.status).toBe(BookingStatus.PendingApproval);
		expect(response.body.data.serviceProviderId).toEqual(serviceProvider.id);

		const endpoint = await OrganisationAdminRequestEndpointSG.create({ serviceId: serviceIdStr });
		const postResponse = await endpoint.post(`/bookings/${bookingId}/reject`);
		expect(postResponse.statusCode).toBe(204);

		const getResponse = await endpoint.get(`/bookings/${bookingId}`);
		expect(getResponse.statusCode).toBe(200);
		expect(getResponse.body).toBeDefined();
		expect(getResponse.body.data.status).toBe(BookingStatus.Rejected);
	});
});
