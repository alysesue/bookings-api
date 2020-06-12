import { Container } from "typescript-ioc";

import { Booking, BookingStatus } from "../../models";

import { TimeslotsController } from "../timeslots.controller";
import { TimeslotsService } from "../timeslots.service";
import { TimeslotResponse } from "../timeslots.apicontract";

const TimeslotsServiceMock = {
	getAggregatedTimeslots: jest.fn(() => Promise.resolve([]))
};

describe("Timeslots Controller", () => {
	it("should call service", async () => {
		Container.bind(TimeslotsService).to(jest.fn(() => TimeslotsServiceMock));
		const controller = Container.get(TimeslotsController);
		const result = await controller.getAggregatedTimeslots(new Date(), new Date(), 1);

		expect(result).toBeDefined();
		expect(TimeslotsServiceMock.getAggregatedTimeslots).toBeCalled();
	});
});
