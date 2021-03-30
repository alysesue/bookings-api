import { Container } from 'typescript-ioc';
import { LabelsRepository } from '../labels.repository';
import { LabelsRepositoryMock } from '../__mocks__/labels.repository.mock';
import { Label, Service } from '../../../models/entities';
import { LabelsService } from '../labels.service';

describe('Test labels service', () => {
	beforeAll(() => {
		Container.bind(LabelsRepository).to(LabelsRepositoryMock);
	});

	it('Should verify if labels are present in Service', () => {
		const label = Label.create('name');
		LabelsRepositoryMock.findMock.mockReturnValue(new Promise(() => [label]));
		Container.get(LabelsService).verifyLabels([label], { id: 2 } as Service);
		expect(LabelsRepositoryMock.findMock).toHaveBeenCalledTimes(1);
	});
});
