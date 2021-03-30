import { Inject, InRequestScope } from 'typescript-ioc';
import { Label, Service } from '../../models/entities';
import { LabelsRepository } from './labels.repository';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';

@InRequestScope
export class LabelsService {
	@Inject
	private labelsRepository: LabelsRepository;

	public async verifyLabels(labels: Label[], service: Service) {
		const labelsService = await this.labelsRepository.find(service.id);
		labels.forEach((label: Label) => {
			const labelFound = labelsService.find((ls) => ls.labelText === label.labelText);
			console.log(labelFound);
			if (!labelFound) {
				throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(`This label is not present: ${label}`);
			}
		});
	}

	public async verifyExistLabels(labels: Label[], service: Service) {
		const labelsService = await this.labelsRepository.find(service.id);
		labels.forEach((label: Label) => {
			const labelFound = labelsService.find((ls) => ls.labelText === label.labelText);
			if (labelFound) {
				throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(`This label is present: ${label}`);
			}
		});
	}
}
