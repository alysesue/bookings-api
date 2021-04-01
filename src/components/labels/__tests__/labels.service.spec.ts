import { Container } from 'typescript-ioc';
import { LabelsRepository } from '../labels.repository';
import { LabelsRepositoryMock } from '../__mocks__/labels.repository.mock';
import { Label, Service } from '../../../models/entities';
import { LabelsService } from '../labels.service';
import { LabelRequestModel } from '../label.apicontract';
import { LabelsMapper } from '../labels.mapper';

describe('Test labels service', () => {
	beforeAll(() => {
		Container.bind(LabelsRepository).to(LabelsRepositoryMock);
		Container.bind(LabelsMapper);
	});
	afterEach(() => {
		jest.resetAllMocks();
	});

	it('Should verify if labels are present in Service & remove duplication', async () => {
		const label = 'name';
		const duplicateLabels: LabelRequestModel[] = [{ label }, { label }];
		const deduplicatedLabel = Container.get(LabelsMapper).mapToLabels(duplicateLabels);

		LabelsRepositoryMock.findMock.mockReturnValue(deduplicatedLabel);
		let resLabel;
		try {
			resLabel = await Container.get(LabelsService).verifyLabels(deduplicatedLabel, { id: 2 } as Service);
		} catch (e) {
			expect(e).toBeFalsy();
		}
		expect(LabelsRepositoryMock.findMock).toHaveBeenCalledTimes(1);
		expect(resLabel).toStrictEqual(deduplicatedLabel);
	});

	it('Service dont have any label', async () => {
		const label = Label.create('name');
		try {
			await Container.get(LabelsService).verifyLabels([label], { id: 2 } as Service);
			expect(LabelsRepositoryMock.findMock).toHaveBeenCalledTimes(1);
		} catch (err) {
			expect(err.message).toBe('Service does not have any labels');
		}
	});
});
