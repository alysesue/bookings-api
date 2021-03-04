import { DateHelper } from '../../../infrastructure/dateHelper';
import { Container } from 'typescript-ioc';
import { OneOffTimeslotsController } from '../oneOffTimeslots.controller';
import { OneOffTimeslotRequest } from '../oneOffTimeslots.apicontract';
import { OneOffTimeslotsService } from '../oneOffTimeslots.service';
import { OneOffTimeslot } from '../../../models';
import { IdHasher } from '../../../infrastructure/idHasher';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

jest.mock('mol-lib-common', () => {
	const actual = jest.requireActual('mol-lib-common');
	const mock = (config: any) => {
		return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => descriptor;
	};
	return {
		...actual,
		MOLAuth: mock,
	};
});

describe('One off timeslots Controller test', () => {
	beforeAll(() => {
		Container.bind(OneOffTimeslotsService).to(OneOffTimeslotsServiceMock);
		Container.bind(IdHasher).to(IdHasherMock);
	});

	afterEach(() => {
		jest.resetAllMocks();
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

		const request = new OneOffTimeslotRequest();
		request.startDateTime = new Date('2021-03-02T00:00:00Z');
		request.endDateTime = DateHelper.addHours(request.startDateTime, 1);
		request.capacity = 2;
		request.serviceProviderId = 1;

		const controller = Container.get(OneOffTimeslotsController);
		const result = await controller.create(request);
		// tslint:disable-next-line: no-console
		console.log(result);

		expect(OneOffTimeslotsServiceMock.save).toHaveBeenCalled();
		expect(result).toBeDefined();
		expect(result).toEqual({
			data: {
				idSigned: 'A',
				startDateTime: new Date('2021-03-02T00:00:00.000Z'),
				endDateTime: new Date('2021-03-02T02:00:00.000Z'),
				capacity: 1,
			},
		});
	});
});

class OneOffTimeslotsServiceMock implements Partial<OneOffTimeslotsService> {
	public static save = jest.fn();
	public async save(...params): Promise<any> {
		return OneOffTimeslotsServiceMock.save(...params);
	}
}

class IdHasherMock implements Partial<IdHasher> {
	public static encode = jest.fn();
	public encode(id: number): string {
		return IdHasherMock.encode();
	}
}
