import { Container } from 'typescript-ioc';
import { LabelsRepository } from '../labels.repository';
import { LabelsRepositoryMock } from '../__mocks__/labels.repository.mock';
import { Label, Service } from '../../../models/entities';
import { LabelsService } from '../labels.service';	
import { MOLErrorV2 } from 'mol-lib-api-contract';

describe('Test labels service', () => {
	beforeAll(() => {
		Container.bind(LabelsRepository).to(LabelsRepositoryMock);
	});

	// Needs review, as this will also throw error because database has no service labels
	it('Should verify if labels are present in Service', async () => {
		const label = Label.create('name');
		// LabelsRepositoryMock.findMock.mockReturnValue(new Promise(() => [label])); // redundant?
		Container.get(LabelsService).verifyLabels([label], { id: 2 } as Service);
		expect(LabelsRepositoryMock.findMock).toHaveBeenCalledTimes(1);
	});

	it('Labels not present in Service', () => {
		const label = Label.create('name');
		Container.get(LabelsService).verifyLabels([label], { id: 2 } as Service);
		try {
			expect(LabelsRepositoryMock.findMock).toHaveBeenCalledTimes(1);
		} catch (err) {
			expect(err).toMatchObject(MOLErrorV2);
		}
	});
});
