import { LabelsRepository } from '../labels.repository';
import { Label } from '../../../models/entities';

export class LabelsRepositoryMock implements Partial<LabelsRepository> {
	public static findMock = jest.fn();

	public async find(...params): Promise<Label[]> {
		return LabelsRepositoryMock.findMock(...params);
	}
}
