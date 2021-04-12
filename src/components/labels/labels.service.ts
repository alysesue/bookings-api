import { Inject, InRequestScope } from 'typescript-ioc';
import { Label } from '../../models/entities';
import { LabelsRepository } from './labels.repository';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { groupByKeyLastValue } from '../../tools/collections';
import { IdHasher } from '../../infrastructure/idHasher';

@InRequestScope
export class LabelsService {
	@Inject
	private labelsRepository: LabelsRepository;
	@Inject
	private idHasher: IdHasher;

	public async verifyLabels(encodedLabelIds: string[], serviceId: number): Promise<Label[]> {
		if (!encodedLabelIds || encodedLabelIds.length === 0) {
			return [];
		}

		const labelIds = new Set<number>(encodedLabelIds.map((encodedId) => this.idHasher.decode(encodedId)));

		const labelsService = await this.labelsRepository.find({ serviceId });
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
