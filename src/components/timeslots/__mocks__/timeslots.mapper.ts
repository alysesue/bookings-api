import { AvailabilityEntryResponse } from '../timeslots.apicontract';
import { TimeslotsMapper } from '../timeslots.mapper';

export class TimeslotsMapperMock implements Partial<TimeslotsMapper> {
	public static mapAvailabilityToResponse = jest.fn();
	public static mapAvailabilityItem = jest.fn();

	public init() {}

	public async mapAvailabilityToResponse(...params): Promise<AvailabilityEntryResponse[]> {
		return await TimeslotsMapperMock.mapAvailabilityToResponse(...params);
	}

	public async mapAvailabilityItem(...params): Promise<AvailabilityEntryResponse | undefined> {
		return await TimeslotsMapperMock.mapAvailabilityItem(...params);
	}
}
