import { ServiceProviderTimeslot } from "../../../models/serviceProviderTimeslot";
import { AvailableTimeslotProviders } from "../availableTimeslotProviders";
import { ServiceProvider, TimeslotsSchedule, TimeslotItem, TimeOfDay } from "../../../models";
import { TimeslotsMapper } from "../timeslots.mapper";
import { TimeslotWithCapacity } from "../../../models/timeslotWithCapacity";
import { DateHelper } from "../../../infrastructure/dateHelper";
import { Service } from "mol-lib-api-contract";

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});
afterEach(() => {
	jest.resetAllMocks();
});


describe('Timeslots Mapper', () => {

	it('should map availability', () => {
		const entry = new AvailableTimeslotProviders();
		entry.startTime = new Date(2020, 8, 26, 8, 0);
		entry.endTime = new Date(2020, 8, 26, 8, 30);

		const spData = ServiceProvider.create('Timmy', 1);
		const sptimeslot = new ServiceProviderTimeslot(spData, 1);
		entry.serviceProviderTimeslots.set(1, sptimeslot);

		const res = TimeslotsMapper.mapAvailabilityItem(entry);

		expect(res.availabilityCount).toBe(1);
		expect(res.endTime.toISOString()).toBe("2020-09-26T00:30:00.000Z");
		expect(res.startTime.toISOString()).toBe("2020-09-26T00:00:00.000Z");
	})

	it('should map service provider timeslot', () => {
		const timeslotItem = new TimeslotItem();
		timeslotItem._id = 1;
		timeslotItem._startTime = TimeOfDay.create({ hours: 8, minutes: 0 });
		timeslotItem._endTime = TimeOfDay.create({ hours: 9, minutes: 0 });


		const timeslotSchedule = new TimeslotsSchedule();
		timeslotSchedule._id = 1;
		timeslotSchedule.timeslotItems = [timeslotItem];

		const serviceProvider1 = ServiceProvider.create('Timmy', 1);
		const serviceProvider2 = ServiceProvider.create('Andy', 1);
		serviceProvider1.timeslotsSchedule = timeslotSchedule;
		serviceProvider2.timeslotsSchedule = timeslotSchedule;
		const sptimeslot1 = new ServiceProviderTimeslot(serviceProvider1, 1);
		const sptimeslot2 = new ServiceProviderTimeslot(serviceProvider2, 5);
		const res = TimeslotsMapper.mapServiceProviderTimeslot([sptimeslot1, sptimeslot2]);
		const [spResponse, totalCapacity, totalBooked] = res;
		expect(spResponse.length).toBe(2);
		expect(spResponse[0].capacity).toBe(1);
		expect(spResponse[1].capacity).toBe(5);
		expect(totalCapacity).toBe(6);
		expect(totalBooked).toBe(0);


	})
});
