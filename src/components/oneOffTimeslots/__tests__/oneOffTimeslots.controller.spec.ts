import { DateHelper } from '../../../infrastructure/dateHelper';
import { Container } from 'typescript-ioc';
import { OneOffTimeslotsController, OneOffTimeslotsControllerV2 } from '../oneOffTimeslots.controller';
import { OneOffTimeslotRequestV1, OneOffTimeslotRequestV2 } from '../oneOffTimeslots.apicontract';
import { OneOffTimeslotsService } from '../oneOffTimeslots.service';
import { Label, OneOffTimeslot } from '../../../models';
import { IdHasher } from '../../../infrastructure/idHasher';
import { LabelResponseModel } from '../../../components/labels/label.apicontract';
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

	afterEach(() => {
		jest.resetAllMocks();
	});

	it('should retrieve back labels from oneOffTimeslots', async () => {
		const oneOffTimeslots = new OneOffTimeslot();
		oneOffTimeslots.id = 1;
		oneOffTimeslots.startDateTime = new Date('2021-03-02T00:00:00Z');
		oneOffTimeslots.endDateTime = new Date('2021-03-02T02:00:00Z');
		oneOffTimeslots.capacity = 1;
		oneOffTimeslots.labels = [Label.create('Chinese')];
		OneOffTimeslotsServiceMock.save.mockReturnValue(Promise.resolve(oneOffTimeslots));
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
			},
		});
	});

	it('should save a new one off timeslot availability', async () => {
		const oneOffTimeslots = new OneOffTimeslot();
		oneOffTimeslots.id = 1;
		oneOffTimeslots.startDateTime = new Date('2021-03-02T00:00:00Z');
		oneOffTimeslots.endDateTime = new Date('2021-03-02T02:00:00Z');
		oneOffTimeslots.capacity = 1;
		OneOffTimeslotsServiceMock.save.mockReturnValue(Promise.resolve(oneOffTimeslots));
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
		const oneOffTimeslots = new OneOffTimeslot();
		oneOffTimeslots.id = 1;
		oneOffTimeslots.startDateTime = new Date('2021-03-02T00:00:00Z');
		oneOffTimeslots.endDateTime = new Date('2021-03-02T02:00:00Z');
		oneOffTimeslots.capacity = 1;
		oneOffTimeslots.title = 'test title';
		oneOffTimeslots.description = 'test description';

		OneOffTimeslotsServiceMock.update.mockReturnValue(Promise.resolve(oneOffTimeslots));
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
				endDateTime: new Date('2021-03-02T02:00:00.000Z'),
				capacity: 1,
				labels: [],
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

	afterEach(() => {
		jest.resetAllMocks();
	});

	it('should retrieve back labels from oneOffTimeslots', async () => {
		const oneOffTimeslots = new OneOffTimeslot();
		oneOffTimeslots.id = 1;
		oneOffTimeslots.startDateTime = new Date('2021-03-02T00:00:00Z');
		oneOffTimeslots.endDateTime = new Date('2021-03-02T02:00:00Z');
		oneOffTimeslots.capacity = 1;
		oneOffTimeslots.labels = [Label.create('Chinese')];
		OneOffTimeslotsServiceMock.save.mockReturnValue(Promise.resolve(oneOffTimeslots));
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
			},
		});
	});

	it('should save a new one off timeslot availability', async () => {
		const oneOffTimeslots = new OneOffTimeslot();
		oneOffTimeslots.id = 1;
		oneOffTimeslots.startDateTime = new Date('2021-03-02T00:00:00Z');
		oneOffTimeslots.endDateTime = new Date('2021-03-02T02:00:00Z');
		oneOffTimeslots.capacity = 1;
		OneOffTimeslotsServiceMock.save.mockReturnValue(Promise.resolve(oneOffTimeslots));
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
		const oneOffTimeslots = new OneOffTimeslot();
		oneOffTimeslots.id = 1;
		oneOffTimeslots.startDateTime = new Date('2021-03-02T00:00:00Z');
		oneOffTimeslots.endDateTime = new Date('2021-03-02T02:00:00Z');
		oneOffTimeslots.capacity = 1;
		oneOffTimeslots.title = 'test title';
		oneOffTimeslots.description = 'test description';

		OneOffTimeslotsServiceMock.update.mockReturnValue(Promise.resolve(oneOffTimeslots));
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

class OneOffTimeslotsServiceMock implements Partial<OneOffTimeslotsService> {
	public static save = jest.fn();
	public static update = jest.fn();
	public static delete = jest.fn();

	public async save(...params): Promise<any> {
		return OneOffTimeslotsServiceMock.save(...params);
	}

	public async update(...params): Promise<any> {
		return OneOffTimeslotsServiceMock.update(...params);
	}

	public async delete(...params): Promise<any> {
		return OneOffTimeslotsServiceMock.delete(...params);
	}
}
