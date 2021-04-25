import { Container } from 'typescript-ioc';
import { ServicesMapper } from '../services.mapper';
import { Service } from '../../../models/entities';
import { LabelsMapper } from '../../labels/labels.mapper';
import { LabelResponseModel } from '../../labels/label.apicontract';

describe('service/services.mapper', () => {
	beforeAll(() => {
		Container.bind(LabelsMapper).to(LabelsMapperMock);
	});

	it('should map service data to response', () => {
		const serviceMapper = Container.get(ServicesMapper);
		const serviceData = new Service();
		serviceData.id = 1;
		serviceData.name = 'name';
		serviceData.isStandAlone = false;
		serviceData.emailSuffix = 'abc.com';

		const labelResponse = new LabelResponseModel();
		labelResponse.id = '1';
		labelResponse.label = 'text';

		LabelsMapperMock.mapToLabelsResponse.mockReturnValue([labelResponse]);

		const serviceResponse = serviceMapper.mapToServiceResponse(serviceData);

		expect(serviceResponse.name).toBe('name');
		expect(serviceResponse.labels[0].label).toBe('text');
		expect(serviceResponse.emailSuffix).toBe('abc.com');
	});
});

class LabelsMapperMock implements Partial<LabelsMapper> {
	public static mapToLabelsResponse = jest.fn();

	public mapToLabelsResponse(...params) {
		return LabelsMapperMock.mapToLabelsResponse(...params);
	}
}
