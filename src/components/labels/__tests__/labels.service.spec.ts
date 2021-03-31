import { Container } from 'typescript-ioc';
import { LabelsRepository } from '../labels.repository';
import { LabelsRepositoryMock } from '../__mocks__/labels.repository.mock';
import { Label, Service } from '../../../models/entities';
import { LabelsService } from '../labels.service';

describe('Test labels service', () => {
	beforeAll(() => {
		Container.bind(LabelsRepository).to(LabelsRepositoryMock);
	});
	afterEach(() => {
		jest.resetAllMocks();
	});

	it('Should verify if labels are present in Service & remove duplication', async () => {
		const label = Label.create('name');
		LabelsRepositoryMock.findMock.mockReturnValue([label]);
		let resLabel;
		try {
			resLabel = await Container.get(LabelsService).verifyLabels([label, label], { id: 2 } as Service);
		} catch (e) {
			expect(e).toBeFalsy();
		}
		expect(LabelsRepositoryMock.findMock).toHaveBeenCalledTimes(1);
		expect(resLabel).toStrictEqual([label]);
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

	it('Labels not present in Service', async () => {
		const label = Label.create('name');
		try {
			await Container.get(LabelsService).verifyLabels([], { id: 2 } as Service);
			expect(LabelsRepositoryMock.findMock).toHaveBeenCalledTimes(1);
		} catch (err) {
			expect(err.message).toBe(`This label is not present: ${label}`);
		}
	});
});
