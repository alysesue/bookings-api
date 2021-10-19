import { DateHelper } from '../../../infrastructure/dateHelper';
import { Container } from 'typescript-ioc';
import { OneOffTimeslotsController, OneOffTimeslotsControllerV2 } from '../oneOffTimeslots.controller';
import { OneOffTimeslotRequestV1, OneOffTimeslotRequestV2 } from '../oneOffTimeslots.apicontract';
import { OneOffTimeslotsService } from '../oneOffTimeslots.service';
import { Event, Label, OneOffTimeslot } from '../../../models';
import { IdHasher } from '../../../infrastructure/idHasher';
import { LabelResponseModel } from '../../../components/labels/label.apicontract';
import { OneOffTimeslotsServiceMock } from '../__mocks__/oneOffTimeslots.service.mock';
import { IdHasherMock } from '../../../infrastructure/__mocks__/idHasher.mock';

jest.mock('../oneOffTimeslots.service', () => {
	class OneOffTimeslotsService {}
	return { OneOffTimeslotsService };
});
jest.mock('../../../infrastructure/idHasher', () => {
	class IdHasher {}
	return { IdHasher };
});

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

describe('One off timeslots Controller V1', () => {
	beforeAll(() => {
		Container.bind(OneOffTimeslotsService).to(OneOffTimeslotsServiceMock);
		Container.bind(IdHasher).to(IdHasherMock);
	});

	const oneOffTimeslots = new OneOffTimeslot();
	const event = new Event();
	oneOffTimeslots.id = 1;
	oneOffTimeslots.startDateTime = new Date('2021-03-02T00:00:00Z');
	oneOffTimeslots.endDateTime = new Date('2021-03-02T01:00:00Z');
	event.capacity = 1;
	event.labels = [Label.create('Chinese')];
	event.oneOffTimeslots = [oneOffTimeslots];
	event.title = 'test title';
	event.description = 'test description';

	const request = new OneOffTimeslotRequestV1();
	request.startDateTime = new Date('2021-03-02T00:00:00Z');
	request.endDateTime = DateHelper.addHours(request.startDateTime, 1);
	request.capacity = 2;
	request.serviceProviderId = 1;

	beforeEach(() => {
		IdHasherMock.encode.mockImplementation(() => {
			return 'A';
		});
	});

	it('should retrieve back labels from oneOffTimeslots', async () => {
		OneOffTimeslotsServiceMock.save.mockReturnValue(Promise.resolve(event));
		const controller = Container.get(OneOffTimeslotsController);
		const result = await controller.create(request);

		const labelResponse: LabelResponseModel[] = [];
		const label = new LabelResponseModel();
		label.id = 'A';
		label.label = 'Chinese';
		labelResponse.push(label);

		expect(OneOffTimeslotsServiceMock.save).toHaveBeenCalled();
		expect(result).toBeDefined();
		expect(result).toEqual({
			data: {
				capacity: 1,
				description: 'test description',
				endDateTime: new Date('2021-03-02T01:00:00.000Z'),
				idSigned: 'A',
				labels: [
					{
						id: 'A',
						label: 'Chinese',
					},
				],
				startDateTime: new Date('2021-03-02T00:00:00.000Z'),
				title: 'test title',
			},
		});
	});

	it('should save a new one off timeslot availability', async () => {
		OneOffTimeslotsServiceMock.save.mockReturnValue(Promise.resolve(event));
		IdHasherMock.encode.mockImplementation(() => {
			return 'A';
		});

		const request = new OneOffTimeslotRequestV1();
		request.startDateTime = new Date('2021-03-02T00:00:00Z');
		request.endDateTime = DateHelper.addHours(request.startDateTime, 1);
		request.capacity = 2;
		request.serviceProviderId = 1;

		const controller = Container.get(OneOffTimeslotsController);
		const result = await controller.create(request);

		expect(OneOffTimeslotsServiceMock.save).toHaveBeenCalled();
		expect(result).toBeDefined();
		expect(result).toEqual({
			data: {
				idSigned: 'A',
				labels: [
					{
						id: 'A',
						label: 'Chinese',
					},
				],
				startDateTime: new Date('2021-03-02T00:00:00Z'),
				endDateTime: request.endDateTime,
				title: 'test title',
				capacity: 1,
				description: 'test description',
			},
		});
	});

	it('should delete one off timeslot', async () => {
		OneOffTimeslotsServiceMock.delete.mockReturnValue(Promise.resolve());
		IdHasherMock.encode.mockImplementation(() => {
			return '1';
		});

		const controller = Container.get(OneOffTimeslotsController);
		await controller.deleteOneOffTimeslot('1');

		expect(OneOffTimeslotsServiceMock.delete).toHaveBeenCalledWith('1');
	});

	it('should update oneOffTimeslots', async () => {
		OneOffTimeslotsServiceMock.update.mockReturnValue(Promise.resolve(event));
		IdHasherMock.encode.mockImplementation(() => {
			return 'A';
		});

		const request = new OneOffTimeslotRequestV1();
		request.startDateTime = new Date('2021-03-02T00:00:00Z');
		request.endDateTime = DateHelper.addHours(request.startDateTime, 1);
		request.capacity = 2;
		request.labelIds = [];
		request.serviceProviderId = 1;

		const controller = Container.get(OneOffTimeslotsController);
		const result = await controller.update('1', request);

		expect(OneOffTimeslotsServiceMock.update).toHaveBeenCalled();
		expect(result).toBeDefined();
		expect(result).toEqual({
			data: {
				idSigned: 'A',
				startDateTime: new Date('2021-03-02T00:00:00.000Z'),
				endDateTime: new Date('2021-03-02T01:00:00.000Z'),
				capacity: 1,
				labels: [
					{
						id: 'A',
						label: 'Chinese',
					},
				],
				title: 'test title',
				description: 'test description',
			},
		});
	});
});

describe('One off timeslots Controller V2', () => {
	beforeAll(() => {
		Container.bind(OneOffTimeslotsService).to(OneOffTimeslotsServiceMock);
		Container.bind(IdHasher).to(IdHasherMock);
	});

	const oneOffTimeslots = new OneOffTimeslot();
	const event = new Event();

	beforeEach(() => {
		oneOffTimeslots.id = 1;
		oneOffTimeslots.startDateTime = new Date('2021-03-02T00:00:00Z');
		oneOffTimeslots.endDateTime = new Date('2021-03-02T02:00:00Z');
		event.capacity = 1;
		event.labels = [Label.create('Chinese')];
		event.oneOffTimeslots = [oneOffTimeslots];
		event.title = 'test title';
		event.description = 'test description';
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it('should retrieve back labels from oneOffTimeslots', async () => {
		OneOffTimeslotsServiceMock.save.mockReturnValue(Promise.resolve(event));
		IdHasherMock.encode.mockImplementation(() => {
			return 'A';
		});

		const request = new OneOffTimeslotRequestV2();
		request.startDateTime = new Date('2021-03-02T00:00:00Z');
		request.endDateTime = DateHelper.addHours(request.startDateTime, 1);
		request.capacity = 2;
		request.serviceProviderId = '1';

		const controller = Container.get(OneOffTimeslotsControllerV2);
		const result = await controller.create(request);

		const labelResponse: LabelResponseModel[] = [];
		const label = new LabelResponseModel();
		label.id = 'A';
		label.label = 'Chinese';
		labelResponse.push(label);

		expect(OneOffTimeslotsServiceMock.save).toHaveBeenCalled();
		expect(result).toBeDefined();
		expect(result).toEqual({
			data: {
				idSigned: 'A',
				startDateTime: new Date('2021-03-02T00:00:00.000Z'),
				endDateTime: new Date('2021-03-02T02:00:00.000Z'),
				labels: labelResponse,
				capacity: 1,
				description: 'test description',
				title: 'test title',
			},
		});
	});

	it('should save a new one off timeslot availability', async () => {
		event.labels = [];
		OneOffTimeslotsServiceMock.save.mockReturnValue(Promise.resolve(event));
		IdHasherMock.encode.mockImplementation(() => {
			return 'A';
		});

		const request = new OneOffTimeslotRequestV2();
		request.startDateTime = new Date('2021-03-02T00:00:00Z');
		request.endDateTime = DateHelper.addHours(request.startDateTime, 1);
		request.capacity = 2;
		request.serviceProviderId = '1';

		const controller = Container.get(OneOffTimeslotsControllerV2);
		const result = await controller.create(request);

		expect(OneOffTimeslotsServiceMock.save).toHaveBeenCalled();
		expect(result).toBeDefined();
		expect(result).toEqual({
			data: {
				idSigned: 'A',
				description: 'test description',
				title: 'test title',
				startDateTime: new Date('2021-03-02T00:00:00.000Z'),
				endDateTime: new Date('2021-03-02T02:00:00.000Z'),
				labels: [],
				capacity: 1,
			},
		});
	});
	it('should delete one off timeslot', async () => {
		OneOffTimeslotsServiceMock.delete.mockReturnValue(Promise.resolve());
		IdHasherMock.encode.mockImplementation(() => {
			return '1';
		});

		const controller = Container.get(OneOffTimeslotsController);
		await controller.deleteOneOffTimeslot('1');

		expect(OneOffTimeslotsServiceMock.delete).toHaveBeenCalledWith('1');
	});

	it('should update oneOffTimeslots', async () => {
		event.labels = [];
		OneOffTimeslotsServiceMock.update.mockReturnValue(Promise.resolve(event));
		IdHasherMock.encode.mockImplementation(() => {
			return 'A';
		});

		const request = new OneOffTimeslotRequestV2();
		request.startDateTime = new Date('2021-03-02T00:00:00Z');
		request.endDateTime = DateHelper.addHours(request.startDateTime, 1);
		request.capacity = 2;
		request.labelIds = [];
		request.serviceProviderId = '1';

		const controller = Container.get(OneOffTimeslotsControllerV2);
		const result = await controller.update('1', request);

		expect(OneOffTimeslotsServiceMock.update).toHaveBeenCalled();
		expect(result).toBeDefined();
		expect(result).toEqual({
			data: {
				idSigned: 'A',
				startDateTime: new Date('2021-03-02T00:00:00.000Z'),
				endDateTime: new Date('2021-03-02T02:00:00.000Z'),
				capacity: 1,
				labels: [],
				title: 'test title',
				description: 'test description',
			},
		});
	});
});
