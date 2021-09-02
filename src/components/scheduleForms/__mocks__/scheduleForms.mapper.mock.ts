import { ScheduleForm } from '../../../models/entities';
import { ScheduleFormsMapper } from '../scheduleForms.mapper';
import { OptionalResult } from '../../../errors';
import { ScheduleFormResponseV1, ScheduleFormResponseV2 } from '../scheduleForms.apicontract';

export class ScheduleFormsMapperMock implements Partial<ScheduleFormsMapper> {
	public static mapToEntity = jest.fn<OptionalResult<ScheduleForm, string[]>, any>();
	public static mapToResponseV1 = jest.fn<ScheduleFormResponseV1, any>();
	public static mapToResponseV2 = jest.fn<ScheduleFormResponseV2, any>();

	public mapToEntity(...params): OptionalResult<ScheduleForm, string[]> {
		return ScheduleFormsMapperMock.mapToEntity(...params);
	}

	public mapToResponseV1(...params): ScheduleFormResponseV1 {
		return ScheduleFormsMapperMock.mapToResponseV1(...params);
	}

	public mapToResponseV2(...params): ScheduleFormResponseV2 {
		return ScheduleFormsMapperMock.mapToResponseV2(...params);
	}
}
