import { Service, TimeOfDay, TimeslotItem, TimeslotsSchedule } from '../../../models';
import { TimeslotItemsMapper } from '../timeslotItems.mapper';
import { Container } from 'typescript-ioc';
import { IdHasher } from '../../../infrastructure/idHasher';
import { IdHasherMock } from '../../../infrastructure/__mocks__/idHasher.mock';
import { TimeslotItemRequest } from '../timeslotItems.apicontract';

describe('Timeslot items mapper tests', () => {
	beforeAll(() => {
		Container.bind(IdHasher).to(IdHasherMock);
	});

	beforeEach(() => {
		jest.resetAllMocks();

		IdHasherMock.encode.mockImplementation((id: number) => String(id));
		IdHasherMock.decode.mockImplementation((id: string) => Number(id));
	});

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

	it('should map TimeslotsSchedule to TimeslotsScheduleResponse V1', async () => {
		const mapper = new TimeslotItemsMapper();
		const res = mapper.mapToTimeslotsScheduleResponseV1(inputData);

		expect(res.timeslots.length).toBe(2);
		expect(res).toEqual({
			timeslots: [
				{
					id: 1,
					startTime: '08:00',
					endTime: '09:00',
				},
				{
					id: 2,
					startTime: '09:00',
					endTime: '10:00',
				},
			],
		});
	});

	it('should map TimeslotsSchedule to TimeslotsScheduleResponse V2', async () => {
		const mapper = new TimeslotItemsMapper();
		const res = mapper.mapToTimeslotsScheduleResponseV2(inputData);

		expect(res.timeslots.length).toBe(2);
		expect(res).toEqual({
			timeslots: [
				{
					id: '1',
					startTime: '08:00',
					endTime: '09:00',
				},
				{
					id: '2',
					startTime: '09:00',
					endTime: '10:00',
				},
			],
		});
	});

	it('should return empty timeslots array if there is not timetslot data V1', async () => {
		const mapper = new TimeslotItemsMapper();
		const res = mapper.mapToTimeslotsScheduleResponseV1(null);

		expect(res.timeslots).toBeDefined();
		expect(res.timeslots.length).toBe(0);
		expect(res).toEqual({ timeslots: [] });
	});

	it('should return empty timeslots array if there is not timetslot data V2', async () => {
		const mapper = new TimeslotItemsMapper();
		const res = mapper.mapToTimeslotsScheduleResponseV2(null);

		expect(res.timeslots).toBeDefined();
		expect(res.timeslots.length).toBe(0);
		expect(res).toEqual({ timeslots: [] });
	});

	it('should map to timeslot item response V1', () => {
		const mapper = new TimeslotItemsMapper();
		const res = mapper.mapToTimeslotItemResponseV1(timeslotItemA);
		expect(res).toEqual({
			id: 1,
			startTime: '08:00',
			endTime: '09:00',
		});
	});

	it('should map to timeslot item response V2', () => {
		const mapper = new TimeslotItemsMapper();
		const res = mapper.mapToTimeslotItemResponseV2(timeslotItemA);
		expect(res).toEqual({
			id: '1',
			startTime: '08:00',
			endTime: '09:00',
		});
	});

	it('should map timeslot item to entity', () => {
		const timeslotItemRequest = new TimeslotItemRequest();
		timeslotItemRequest.startTime = '9:00';
		timeslotItemRequest.endTime = '10:00';
		const mapper = new TimeslotItemsMapper();
		const res = mapper.mapTimeslotItemToEntity(timeslotItemRequest, timeslotItemA);
		expect(res).toEqual({
			_capacity: 1,
			_endTime: {
				_asMilliseconds: 36000000,
				_asMinutes: 600,
				_hours: 10,
				_minutes: 0,
			},
			_id: 1,
			_startTime: {
				_asMilliseconds: 32400000,
				_asMinutes: 540,
				_hours: 9,
				_minutes: 0,
			},
		});
	});
});
