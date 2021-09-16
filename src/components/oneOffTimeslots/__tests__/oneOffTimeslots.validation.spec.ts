import { OneOffTimeslotsValidation } from '../oneOffTimeslots.validation';
import { Container } from 'typescript-ioc';
import { OneOffTimeslot } from '../../../models';
import { OneOffTimeslotRequestV1 } from '../oneOffTimeslots.apicontract';
import { DateHelper } from '../../../infrastructure/dateHelper';
import { OneOffTimeslotsRepository } from '../oneOffTimeslots.repository';
import { ContainerContext, ContainerContextHolder } from '../../../infrastructure/containerContext';
import { OneOffTimeslotsRepositoryMock } from '../__mocks__/oneOffTimeslots.repository.mock';

beforeAll(() => {
	ContainerContextHolder.registerInContainer();

	Container.bind(OneOffTimeslotsRepository).to(OneOffTimeslotsRepositoryMock);
});

describe('Validation of oneOffTimeslots', () => {
	beforeEach(() => {
		jest.resetAllMocks();

		OneOffTimeslotsRepositoryMock.search.mockImplementation(() => Promise.resolve([{}] as OneOffTimeslot[]));
	});

	it('should get new instance for validator in Request scope', () => {
		const context = Container.get(ContainerContext);
		const factory = () => context.resolve(OneOffTimeslotsValidation);

		expect(factory() === factory()).toBe(false);
	});

	it('Should return error due to validation ', async () => {
		const oneOffTimeslot = new OneOffTimeslot();
		oneOffTimeslot.startDateTime = new Date('2021-03-02T00:00:00Z');
		oneOffTimeslot.endDateTime = new Date('2021-03-02T00:00:00Z');
		const oneOffTimeslotsValidation = Container.get(OneOffTimeslotsValidation);
		const validate = async () => await oneOffTimeslotsValidation.validate(oneOffTimeslot);
		await expect(validate).rejects.toThrow('Start time must be less than end time');
	});

	it('should return true when requested timeslot does not overlap with another oneOffTimeslot', async () => {
		const request = new OneOffTimeslotRequestV1();
		request.startDateTime = new Date('2021-03-02T00:00:00Z');
		request.endDateTime = DateHelper.addHours(request.startDateTime, 1);
		request.capacity = 2;
		request.serviceProviderId = 1;
		const oneOffTimeslotsValidation = Container.get(OneOffTimeslotsValidation);
		const result = await oneOffTimeslotsValidation.validateOneOffTimeslotsAvailability(request);
		expect(result).toBe(true);
	});

	it('should throw error when requested timeslot overlaps with another oneOffTimeslot', async () => {
		const request = new OneOffTimeslotRequestV1();
		request.startDateTime = new Date('2021-03-02T00:00:00Z');
		request.endDateTime = new Date('2021-03-02T01:00:00Z');
		request.capacity = 2;
		request.serviceProviderId = 1;

		OneOffTimeslotsRepositoryMock.search.mockImplementation(() =>
			Promise.resolve([
				{
					id: 5,
					startDateTime: new Date('2021-03-02T00:00:00Z'),
					endDateTime: new Date('2021-03-02T01:00:00Z'),
				} as OneOffTimeslot,
			]),
		);

		const oneOffTimeslotsValidation = Container.get(OneOffTimeslotsValidation);
		const asyncTest = async () => await oneOffTimeslotsValidation.validateOneOffTimeslotsAvailability(request);
		await expect(asyncTest).rejects.toThrow('Slot cannot be created as it overlaps with an existing slot.');
	});
});
