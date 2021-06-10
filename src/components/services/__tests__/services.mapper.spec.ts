import { Container } from 'typescript-ioc';
import { ServicesMapper } from '../services.mapper';
import { Service } from '../../../models/entities';
import { LabelsMapper } from '../../labels/labels.mapper';
import {LabelRequestModel, LabelResponseModel} from '../../labels/label.apicontract';
import {AdditionalSettingsReq, ServiceRequest} from "../service.apicontract";

describe('service/services.mapper', () => {
	beforeAll(() => {
		Container.bind(LabelsMapper).to(LabelsMapperMock);
	});

	it('should map service data to response', () => {
		const serviceMapper = Container.get(ServicesMapper);
		const serviceData = new Service();
		serviceData.id = 1;
		serviceData.name = 'name';
		serviceData.emailSuffix = 'abc.com';
		serviceData.isStandAlone = false;
		serviceData.sendNotifications = true;

		const labelResponse = new LabelResponseModel();
		labelResponse.id = '1';
		labelResponse.label = 'text';

		LabelsMapperMock.mapToLabelsResponse.mockReturnValue([labelResponse]);

		const serviceResponse = serviceMapper.mapToServiceResponse(serviceData);

		expect(serviceResponse.name).toBe('name');
		expect(serviceResponse.emailSuffix).toBe('abc.com');
		expect(serviceResponse.additionalSettings.isStandAlone).toBe(false);
		expect(serviceResponse.additionalSettings.sendNotifications).toBe(true);
		expect(serviceResponse.labels[0].label).toBe('text');
	});

	it('should map service request to service data', () => {
		// const serviceMapper = Container.get(ServicesMapper);
		const serviceData = new Service();
		const serviceRequest = new ServiceRequest();
		serviceRequest.name = 'name';
		serviceRequest.emailSuffix = 'abc.com';
		serviceRequest.additionalSettings = {} as AdditionalSettingsReq;
		serviceRequest.additionalSettings.isStandAlone = false;
		serviceRequest.additionalSettings.sendNotifications = true;

		const labelRequest = new LabelRequestModel();
		labelRequest.label = 'text';

		LabelsMapperMock.mapToLabels.mockReturnValue([labelRequest]);

		// const serviceData = serviceMapper.mapFromServiceRequest(serviceData, serviceRequest);
		ServicesMapper.mapFromServiceRequest(serviceData, serviceRequest);
		expect(serviceData.name).toBe('name');
		expect(serviceData.emailSuffix).toBe('abc.com');
		expect(serviceData.isStandAlone).toBe(false);
		expect(serviceData.sendNotifications).toBe(true);
		//ToDo: test the following after api fix
		// expect(serviceData.labels[0]).toBe('text');
	});

});

class LabelsMapperMock implements Partial<LabelsMapper> {
	public static mapToLabelsResponse = jest.fn();
	public static mapToLabels = jest.fn();

	public mapToLabelsResponse(...params) {
		return LabelsMapperMock.mapToLabelsResponse(...params);
	}
}
