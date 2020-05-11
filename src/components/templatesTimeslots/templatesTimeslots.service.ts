import { Inject, Singleton } from 'typescript-ioc';
import { TemplatesTimeslotsRepository } from "./templatesTimeslots.repository";
import { TemplateTimeslots } from '../../models/templateTimeslots';
import { TimeslotParams } from "./templatesTimeslots.apicontract";

@Singleton
export default class TemplatesTimeslotsService {
	@Inject
	private timeslotsRepository: TemplatesTimeslotsRepository;

	public async getAllAvailableTimeslots(): Promise<TemplateTimeslots[]> {
		return Promise.resolve([]);
	}

	public async upsertTemplateTimeslots(template: TimeslotParams): Promise<TemplateTimeslots> {
		const { name, firstSlotStartTime, lastSlotEndTime, slotsDuration } = template;
		const newTemplateModel: TemplateTimeslots = new TemplateTimeslots(name, firstSlotStartTime, lastSlotEndTime, slotsDuration);
		const templateRes: TemplateTimeslots = await this.timeslotsRepository.getTemplateTimeslots(newTemplateModel.name);
		if (newTemplateModel) {
			newTemplateModel.id = templateRes.id;
		}
		return (await this.timeslotsRepository.setTemplateTimeslots(newTemplateModel));
	}

	public async deleteTemplateTimeslots(timeslotId: number): Promise<void> {
		await this.timeslotsRepository.deleteTimeslot(timeslotId);
	}

}
