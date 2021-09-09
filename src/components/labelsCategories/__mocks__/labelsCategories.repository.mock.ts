import { LabelsCategoriesRepository } from '../labelsCategories.repository';
import { LabelCategory } from '../../../models/entities';

export class LabelsCategoriesRepositoryMock implements Partial<LabelsCategoriesRepository> {
	public static deleteMock = jest.fn();
	public static saveMock = jest.fn();
	public static findMock = jest.fn();

	public async delete(...params) {
		return LabelsCategoriesRepositoryMock.deleteMock(...params);
	}

	public async save(...params): Promise<LabelCategory[]> {
		return LabelsCategoriesRepositoryMock.saveMock(...params);
	}

	public async find(...params): Promise<LabelCategory[]> {
		return LabelsCategoriesRepositoryMock.findMock(...params);
	}
}
