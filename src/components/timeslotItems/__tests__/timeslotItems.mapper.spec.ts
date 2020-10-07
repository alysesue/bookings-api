import { mapToTimeslotsScheduleResponse } from "../timeslotItems.mapper";
import { TimeslotsSchedule, Service, TimeslotItem, TimeOfDay } from "../../../models";

describe('TimeslotsSchedule template services ', () => {

	it('should map TimeslotsSchedule to TimeslotsScheduleResponse', async () => {

		const timeslotItemA = new TimeslotItem();
		timeslotItemA._id = 1;
		timeslotItemA._startTime = TimeOfDay.create({ hours: 8, minutes: 0 });
		timeslotItemA._endTime = TimeOfDay.create({ hours: 9, minutes: 0 });

		const timeslotItemB = new TimeslotItem();
		timeslotItemB._id = 2;
		timeslotItemB._startTime = TimeOfDay.create({ hours: 9, minutes: 0 });
		timeslotItemB._endTime = TimeOfDay.create({ hours: 10, minutes: 0 });

		const inputData = new TimeslotsSchedule();
		inputData._id = 1;
		inputData._service = new Service();
		inputData.timeslotItems = [timeslotItemA, timeslotItemB];

		const res = mapToTimeslotsScheduleResponse(inputData);

		expect(res.timeslots.length).toBe(2);

	});

	it('should return empty timeslots array if there is not timetslot data', async () => {

		const res = mapToTimeslotsScheduleResponse(null);

		expect(res.timeslots).toBeDefined();
		expect(res.timeslots.length).toBe(0);


	});
})
