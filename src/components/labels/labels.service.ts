import { Inject, InRequestScope } from 'typescript-ioc';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { Label, Service } from '../../models/entities';
import { groupByKeyLastValue } from '../../tools/collections';
import { IdHasher } from '../../infrastructure/idHasher';
import { LabelsRepository } from './labels.repository';

@InRequestScope
export class LabelsService {
	@Inject
	private labelsRepository: LabelsRepository;
	@Inject
	private idHasher: IdHasher;

	public async delete(labels: Label[]): Promise<void> {
		if (!labels.length) return;
		await this.labelsRepository.delete(labels);
	}

	public async update(labels: Label[]): Promise<Label[]> {
		if (!labels.length) return [];
		return await this.labelsRepository.save(labels);
	}

	public sortLabelForDeleteCategory(
		labelsNoCategory: Label[],
		labelsCategory: Label[],
	): { movedLabelsToNoCategory: Label[]; deleteLabels: Label[] } {
		const movedLabelsToNoCategory = labelsCategory.filter((labelCat) =>
			labelsNoCategory.some((labelNoCat) => labelCat.id === labelNoCat.id),
		);
		const deleteLabels = labelsCategory.filter(
			(labelCat) => !labelsNoCategory.some((labelNoCat) => labelCat.id === labelNoCat.id),
		);
		return { movedLabelsToNoCategory, deleteLabels };
	}

	public async updateLabelToNoCategory(labels: Label[], service: Service): Promise<Label[]> {
		labels.forEach((label) => {
			label.categoryId = null;
			label.serviceId = service.id;
		});

		const updateLabel = await this.update(labels);
		return [...service.labels, ...updateLabel];
	}

	public async verifyLabels(encodedLabelIds: string[], serviceId: number): Promise<Label[]> {
		if (!encodedLabelIds || encodedLabelIds.length === 0) {
			return [];
		}

		const labelIds = new Set<number>(encodedLabelIds.map((encodedId) => this.idHasher.decode(encodedId)));

		const labelsService = await this.labelsRepository.find({ serviceIds: [serviceId] });
		const labelsLookup = groupByKeyLastValue(labelsService, (label) => label.id);

		const labelsFound: Label[] = [];
		labelIds.forEach((labelId: number) => {
			const labelFound = labelsLookup.get(labelId);
			if (!labelFound) {
				throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(
					`Invalid label id: ${this.idHasher.encode(labelId)}`,
				);
			}
			labelsFound.push(labelFound);
		});
		return labelsFound;
	}
}
