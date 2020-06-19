import { Container } from "typescript-ioc";
import { TimeslotsController } from "../timeslots.controller";
import { TimeslotsService } from "../timeslots.service";

const TimeslotsServiceMock = {
	getAggregatedTimeslots: jest.fn(() => Promise.resolve([]))
};

describe("Timeslots Controller", () => {
	it("should get availability", async () => {
		Container.bind(TimeslotsService).to(jest.fn(() => TimeslotsServiceMock));
		const controller = Container.get(TimeslotsController);
		const result = await controller.getAvailability(new Date(), new Date(), 1);

		expect(result).toBeDefined();
		expect(TimeslotsServiceMock.getAggregatedTimeslots).toBeCalled();
	});
});
