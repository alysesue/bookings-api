import { ScheduleFormsService } from '../scheduleForms.service';

export class ScheduleFormsServiceMock implements Partial<ScheduleFormsService> {
	public static updateScheduleFormInEntity = jest.fn();

	public async updateScheduleFormInEntity(...params): Promise<any> {
		return await ScheduleFormsServiceMock.updateScheduleFormInEntity(...params);
	}
}
