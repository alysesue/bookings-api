import { Inject, Singleton } from 'typescript-ioc';
import { DeleteResult } from "typeorm";
import { TemplatesTimeslotsRepository } from "./templatesTimeslots.repository";
import { TemplateTimeslots } from '../../models/templateTimeslots';
import { TemplateTimeslotRequest, TemplateTimeslotResponse } from "./templatesTimeslots.apicontract";
import { diffHours, isValidFormatHHmm } from "../../tools/date";

@Singleton
export default class TemplatesTimeslotsService {
	@Inject
	private timeslotsRepository: TemplatesTimeslotsRepository;

	public async createTemplateTimeslots(template: TemplateTimeslotRequest): Promise<TemplateTimeslotResponse> {
		this.checkTemplateTimeslots(template);
		const newTemplateModel: TemplateTimeslots = new TemplateTimeslots();
		newTemplateModel.mapTemplateTimeslotRequest(template);
		const templateSet: TemplateTimeslots = (await this.timeslotsRepository.setTemplateTimeslots(newTemplateModel));
		return new TemplateTimeslotResponse(templateSet);
	}

	public async updateTemplateTimeslots(template: TemplateTimeslotRequest): Promise<TemplateTimeslotResponse> {
		const newTemplateModel: TemplateTimeslots = new TemplateTimeslots();
		newTemplateModel.mapTemplateTimeslotRequest(template);
		const templateGet: TemplateTimeslots = await this.timeslotsRepository.getTemplateTimeslotsByName(newTemplateModel.name);
		if (templateGet) {
			newTemplateModel.id = templateGet.id;
		}
		const templateSet: TemplateTimeslots = (await this.timeslotsRepository.setTemplateTimeslots(newTemplateModel));
		return new TemplateTimeslotResponse(templateSet);
	}

	public async deleteTemplateTimeslots(id: number): Promise<DeleteResult> {
		return await this.timeslotsRepository.deleteTemplateTimeslots(id);
	}

	private checkTemplateTimeslots(templatable: TemplateTimeslotRequest): void {
		if (!(isValidFormatHHmm(templatable.firstSlotStartTimeInHHmm)))
			throw new Error(`Not valid format for firstSlotStartTimeInHHmm: ${templatable.firstSlotStartTimeInHHmm}`);

		if (!(isValidFormatHHmm(templatable.firstSlotEndTimeInHHmm)))
			throw new Error(`Not valid format for firstSlotEndTimeInHHmm: ${templatable.firstSlotEndTimeInHHmm}`);

		const diff = diffHours(templatable.firstSlotStartTimeInHHmm, templatable.firstSlotEndTimeInHHmm);
		if (diff < 0)
			throw new Error(`firstSlotStartTimeInHHmm=${templatable.firstSlotStartTimeInHHmm} > firstSlotEndTimeInHHmm=${templatable.firstSlotEndTimeInHHmm}`);
		if (diff < templatable.slotsDurationInMin)
			throw new Error(`slotsDurationInMin=${templatable.slotsDurationInMin} < (firstSlotEndTimeInHHmm-firstSlotStartTimeInHHmm)=${diff}`);

	}

}
