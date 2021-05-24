import { Label } from '../../../models/entities';
import { LabelsService } from '../labels.service';

export class LabelsServiceMock implements Partial<LabelsService> {
	public static deleteMock = jest.fn();
	public static updateMock = jest.fn();
	public static sortLabelForDeleteCategoryMock = jest.fn();
	public static updateLabelToNoCategoryMock = jest.fn();

	public async delete(...param): Promise<void> {
		return LabelsServiceMock.deleteMock(...param);
	}

	public async update(...param): Promise<Label[]> {
		return LabelsServiceMock.updateMock(...param);
	}
	public sortLabelForDeleteCategory(...param): { movedLabelsToNoCategory: Label[]; deleteLabels: Label[] } {
		return LabelsServiceMock.sortLabelForDeleteCategoryMock(...param);
	}

	public async updateLabelToNoCategory(...param): Promise<Label[]> {
		return LabelsServiceMock.updateLabelToNoCategoryMock(...param);
	}
}
