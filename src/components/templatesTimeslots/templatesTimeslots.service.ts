import { Inject, Singleton } from 'typescript-ioc';
import TemplatesTimeslotsRepository from "./templatesTimeslots.repository";
import { TemplateTimeslots } from '../../models/templateTimeslots';
import { TimeslotParams } from "./templatesTimeslots.apicontract";
import { DeleteResult } from "typeorm";

@Singleton
export default class TemplatesTimeslotsService {
	@Inject
	private timeslotsRepository: TemplatesTimeslotsRepository;

	public async getTemplateTimeslots(id): Promise<TemplateTimeslots> {
		return (await this.timeslotsRepository.getTemplateTimeslotsById(id));
	}

	public async upsertTemplateTimeslots(template: TimeslotParams): Promise<TemplateTimeslots> {
		const {name, firstSlotStartTime, lastSlotEndTime, slotsDuration, weekdays, calendars} = template;
		const newTemplateModel: TemplateTimeslots = new TemplateTimeslots(name, firstSlotStartTime, lastSlotEndTime, slotsDuration, weekdays, calendars);
		const templateRes: TemplateTimeslots = await this.timeslotsRepository.getTemplateTimeslotsByName(newTemplateModel.name);
		if (templateRes) {
			newTemplateModel.id = templateRes.id;
		}
		return (await this.timeslotsRepository.setTemplateTimeslots(newTemplateModel));
	}

	public async deleteTemplateTimeslots(id: number): Promise<number | null> {
		const res =  await this.timeslotsRepository.deleteTemplateTimeslots(id);
		if (!res.affected)
			return 0;
		return res.affected;
	}

}
