import { LabelsRepository } from '../labels.repository';
import { Label } from '../../../models/entities';

export class LabelsRepositoryMock implements Partial<LabelsRepository> {
	public static findMock = jest.fn();
	public static deleteMock = jest.fn();
	public static saveMock = jest.fn();

	public async delete(...params) {
		return LabelsRepositoryMock.deleteMock(...params);
	}

	public async save(...params): Promise<Label[]> {
		return LabelsRepositoryMock.saveMock(...params);
	}

	public async find(...params): Promise<Label[]> {
		return LabelsRepositoryMock.findMock(...params);
	}
}
