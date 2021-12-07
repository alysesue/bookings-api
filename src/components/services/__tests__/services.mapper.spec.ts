import { Container } from 'typescript-ioc';
import { ServicesMapper } from '../services.mapper';
import { Organisation, Service } from '../../../models/entities';
import { LabelsMapper } from '../../labels/labels.mapper';
import { LabelResponseModel } from '../../labels/label.apicontract';
import { AdditionalSettings, ServiceRequestV1 } from '../service.apicontract';
import { IdHasherMock } from '../../../infrastructure/__mocks__/idHasher.mock';
import { IdHasher } from '../../../infrastructure/idHasher';
import { CitizenAuthenticationType } from '../../../models/citizenAuthenticationType';

describe('service/services.mapper', () => {
	const organisation = new Organisation();
	organisation.id = 2;
	organisation.name = 'org';

	beforeAll(() => {
		Container.bind(LabelsMapper).to(LabelsMapperMock);
		Container.bind(IdHasher).to(IdHasherMock);
	});

	it('should map simple service data to response V1', () => {
		const serviceMapper = Container.get(ServicesMapper);
		const serviceData = new Service();
		serviceData.id = 1;
		serviceData.name = 'name';

		LabelsMapperMock.mapToLabelsResponse.mockReturnValue([]);

		const serviceResponse = serviceMapper.mapToServiceResponseV1(serviceData);

		expect(serviceResponse).toEqual({
			id: 1,
			name: 'name',
			additionalSettings: { allowAnonymousBookings: false },
			categories: [],
			labels: [],
		});
	});

	it('should map simple service data to response V2', () => {
		const serviceMapper = Container.get(ServicesMapper);
		const serviceData = new Service();
		serviceData.id = 1;
		serviceData.name = 'name';

		LabelsMapperMock.mapToLabelsResponse.mockReturnValue([]);

		IdHasherMock.encode.mockImplementation(() => serviceData.id.toString());

		const serviceResponse = serviceMapper.mapToServiceResponseV2(serviceData, true);

		expect(serviceResponse).toEqual({
			id: '1',
			orgId: '1',
			name: 'name',
			additionalSettings: { allowAnonymousBookings: false },
			categories: [],
			labels: [],
		});
	});

	it('should map service data to response V1', () => {
		const serviceMapper = Container.get(ServicesMapper);
		const serviceData = Service.create('name', organisation);
		serviceData.id = 1;
		serviceData.name = 'name';
		serviceData.emailSuffix = 'abc.com';
		serviceData.citizenAuthentication = [CitizenAuthenticationType.Otp];
		serviceData.isOnHold = false;
		serviceData.isStandAlone = true;
		serviceData.sendNotifications = true;
		serviceData.sendSMSNotifications = true;
		serviceData.sendNotificationsToServiceProviders = false;
		serviceData.minDaysInAdvance = 10;
		serviceData.maxDaysInAdvance = 20;
		serviceData.description = 'desc';
		serviceData.setIsSpAutoAssigned(false);
		serviceData.setNoNric(false);
		serviceData.videoConferenceUrl = 'https://a.com';

		const labelResponse = new LabelResponseModel();
		labelResponse.id = '1';
		labelResponse.label = 'text';

		LabelsMapperMock.mapToLabelsResponse.mockReturnValue([labelResponse]);

		const serviceResponse = serviceMapper.mapToServiceResponseV1(serviceData);

		expect(serviceResponse).toEqual({
			additionalSettings: {
				allowAnonymousBookings: true,
				citizenAuthentication: ['otp'],
				isOnHold: false,
				isStandAlone: true,
				sendNotifications: true,
				sendNotificationsToServiceProviders: false,
				sendSMSNotifications: true,
				bookingLimitation: {
					bookingLimitationType: 'NoLimitations',
				},
			},
			categories: [],
			description: 'desc',
			emailSuffix: 'abc.com',
			id: 1,
			isSpAutoAssigned: false,
			isStandAlone: true,
			labels: [
				{
					id: '1',
					label: 'text',
				},
			],
			maxDaysInAdvance: 20,
			minDaysInAdvance: 10,
			name: 'name',
			noNric: false,
			videoConferenceUrl: 'https://a.com',
		});
	});

	it('should map service data to response V2', () => {
		const serviceMapper = Container.get(ServicesMapper);
		const serviceData = Service.create('name', organisation);
		serviceData.id = 1;
		serviceData.name = 'name';
		serviceData.emailSuffix = 'abc.com';
		serviceData.citizenAuthentication = [CitizenAuthenticationType.Singpass];
		serviceData.isOnHold = false;
		serviceData.isStandAlone = true;
		serviceData.sendNotifications = true;
		serviceData.sendSMSNotifications = true;
		serviceData.sendNotificationsToServiceProviders = false;
		serviceData.minDaysInAdvance = 10;
		serviceData.maxDaysInAdvance = 20;
		serviceData.description = 'desc';
		serviceData.setIsSpAutoAssigned(false);
		serviceData.setNoNric(false);
		serviceData.videoConferenceUrl = 'https://a.com';

		const labelResponse = new LabelResponseModel();
		labelResponse.id = '1';
		labelResponse.label = 'text';

		LabelsMapperMock.mapToLabelsResponse.mockReturnValue([labelResponse]);

		IdHasherMock.encode.mockImplementation(() => serviceData.id.toString());

		const serviceResponse = serviceMapper.mapToServiceResponseV2(serviceData);

		expect(serviceResponse).toEqual({
			additionalSettings: {
				allowAnonymousBookings: false,
				citizenAuthentication: ['singpass'],
				isOnHold: false,
				isStandAlone: true,
				sendNotifications: true,
				sendNotificationsToServiceProviders: false,
				sendSMSNotifications: true,
				bookingLimitation: {
					bookingLimitationType: 'NoLimitations',
				},
			},
			categories: [],
			description: 'desc',
			emailSuffix: 'abc.com',
			id: '1',
			isSpAutoAssigned: false,
			isStandAlone: true,
			labels: [
				{
					id: '1',
					label: 'text',
				},
			],
			maxDaysInAdvance: 20,
			minDaysInAdvance: 10,
			name: 'name',
			noNric: false,
			videoConferenceUrl: 'https://a.com',
		});
	});

	it('should map service request to service data', () => {
		const serviceData = new Service();
		const serviceRequest = new ServiceRequestV1();
		serviceRequest.name = 'name';
		serviceRequest.emailSuffix = 'abc.com';

		const servicesMapper = Container.get(ServicesMapper);
		servicesMapper.mapToEntityV1(serviceData, serviceRequest);
		expect(serviceData.name).toBe('name');
		expect(serviceData.emailSuffix).toBe('abc.com');
	});

	it('(2) should map service request to service data - with additional settings', () => {
		const serviceData = new Service();
		const serviceRequest = new ServiceRequestV1();
		serviceRequest.name = 'name';
		serviceRequest.emailSuffix = 'abc.com';
		serviceRequest.additionalSettings = new AdditionalSettings();
		serviceRequest.additionalSettings.allowAnonymousBookings = true;
		serviceRequest.additionalSettings.isOnHold = false;
		serviceRequest.additionalSettings.isStandAlone = true;
		serviceRequest.additionalSettings.sendNotifications = true;
		serviceRequest.additionalSettings.sendSMSNotifications = true;
		serviceRequest.additionalSettings.sendNotificationsToServiceProviders = false;

		const servicesMapper = Container.get(ServicesMapper);
		servicesMapper.mapToEntityV1(serviceData, serviceRequest);
		expect(serviceData.name).toBe('name');
		expect(serviceData.emailSuffix).toBe('abc.com');
		expect(serviceData.citizenAuthentication).toEqual(['otp']);
		expect(serviceData.isOnHold).toBe(false);
		expect(serviceData.isStandAlone).toBe(true);
		expect(serviceData.sendNotifications).toBe(true);
		expect(serviceData.sendSMSNotifications).toBe(true);
		expect(serviceData.sendNotificationsToServiceProviders).toBe(false);
		expect(serviceData.minDaysInAdvance).toBe(null);
		expect(serviceData.maxDaysInAdvance).toBe(null);
	});

	it('(3) should map service request to service data - with days in advance', () => {
		const serviceData = new Service();
		const serviceRequest = new ServiceRequestV1();
		serviceRequest.name = 'name';
		serviceRequest.emailSuffix = 'abc.com';
		serviceRequest.additionalSettings = new AdditionalSettings();
		serviceRequest.additionalSettings.allowAnonymousBookings = true;
		serviceRequest.additionalSettings.isOnHold = false;
		serviceRequest.additionalSettings.isStandAlone = true;
		serviceRequest.additionalSettings.sendNotifications = true;
		serviceRequest.additionalSettings.sendNotificationsToServiceProviders = false;
		serviceRequest.minDaysInAdvance = 10;
		serviceRequest.maxDaysInAdvance = 60;

		const servicesMapper = Container.get(ServicesMapper);
		servicesMapper.mapToEntityV1(serviceData, serviceRequest);
		expect(serviceData.name).toBe('name');
		expect(serviceData.emailSuffix).toBe('abc.com');
		expect(serviceData.citizenAuthentication).toEqual(['otp']);
		expect(serviceData.isOnHold).toBe(false);
		expect(serviceData.isStandAlone).toBe(true);
		expect(serviceData.sendNotifications).toBe(true);
		expect(serviceData.sendNotificationsToServiceProviders).toBe(false);
		expect(serviceData.minDaysInAdvance).toBe(10);
		expect(serviceData.maxDaysInAdvance).toBe(60);
	});

	it('should remove OTP setting when mapping - additional settings', () => {
		const serviceData = new Service();
		serviceData.citizenAuthentication = [CitizenAuthenticationType.Singpass, CitizenAuthenticationType.Otp];

		const serviceRequest = new ServiceRequestV1();
		serviceRequest.name = 'name';
		serviceRequest.additionalSettings = new AdditionalSettings();
		serviceRequest.additionalSettings.allowAnonymousBookings = false;

		const servicesMapper = Container.get(ServicesMapper);
		servicesMapper.mapToEntityV1(serviceData, serviceRequest);

		expect(serviceData.citizenAuthentication).toEqual(['singpass']);
	});

	it('(2) should not change OTP setting when undefined - additional settings', () => {
		const serviceData = new Service();

		const serviceRequest = new ServiceRequestV1();
		serviceRequest.name = 'name';
		serviceRequest.additionalSettings = new AdditionalSettings();
		serviceRequest.additionalSettings.allowAnonymousBookings = false;

		const servicesMapper = Container.get(ServicesMapper);
		servicesMapper.mapToEntityV1(serviceData, serviceRequest);

		expect(serviceData.citizenAuthentication).toEqual(undefined);
	});

	it('should add OTP setting when mapping - additional settings', () => {
		const serviceData = new Service();
		serviceData.citizenAuthentication = [CitizenAuthenticationType.Singpass];

		const serviceRequest = new ServiceRequestV1();
		serviceRequest.name = 'name';
		serviceRequest.additionalSettings = new AdditionalSettings();
		serviceRequest.additionalSettings.allowAnonymousBookings = true;

		const servicesMapper = Container.get(ServicesMapper);
		servicesMapper.mapToEntityV1(serviceData, serviceRequest);

		expect(serviceData.citizenAuthentication).toEqual(['singpass', 'otp']);
	});

	it('(2) should add OTP setting when mapping - additional settings', () => {
		const serviceData = new Service();

		const serviceRequest = new ServiceRequestV1();
		serviceRequest.name = 'name';
		serviceRequest.additionalSettings = new AdditionalSettings();
		serviceRequest.additionalSettings.allowAnonymousBookings = true;

		const servicesMapper = Container.get(ServicesMapper);
		servicesMapper.mapToEntityV1(serviceData, serviceRequest);

		expect(serviceData.citizenAuthentication).toEqual(['otp']);
	});
});

class LabelsMapperMock implements Partial<LabelsMapper> {
	public static mapToLabelsResponse = jest.fn();

	public mapToLabelsResponse(...params) {
		return LabelsMapperMock.mapToLabelsResponse(...params);
	}
}
