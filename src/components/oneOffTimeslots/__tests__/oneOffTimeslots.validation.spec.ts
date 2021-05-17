import { OneOffTimeslotsValidation } from '../oneOffTimeslots.validation';
import { Container } from 'typescript-ioc';
import { OneOffTimeslot } from '../../../models';
import { OneOffTimeslotRequest } from '../oneOffTimeslots.apicontract';
import { DateHelper } from '../../../infrastructure/dateHelper';
import { OneOffTimeslotsRepository } from '../oneOffTimeslots.repository';
import { OneOffTimeslotsRepositoryMock } from '../__mocks__/oneOffTimeslots.mock';
import { ContainerContext, ContainerContextHolder } from '../../../infrastructure/containerContext';

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

	it('Should return multiple errors due to validation ', async () => {
		const oneOffTimeslot = new OneOffTimeslot();
		oneOffTimeslot.startDateTime = new Date('2021-03-02T00:00:00Z');
		oneOffTimeslot.endDateTime = new Date('2021-03-02T00:00:00Z');
		let longStr = '';
		while (longStr.length < 4001) {
			longStr += 'tttttttttttttttttttttttttttttttttttttttt';
		}
		oneOffTimeslot.title =
			'iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii';
		oneOffTimeslot.description = longStr;
		const oneOffTimeslotsValidation = Container.get(OneOffTimeslotsValidation);
		const validate = async () => await oneOffTimeslotsValidation.validate(oneOffTimeslot);
		await expect(validate).rejects.toThrow('Start time must be less than end time');
		await expect(validate).rejects.toThrow('[10101] Title word limit is 100 characters');
		await expect(validate).rejects.toThrow('[10103] Description word limit is 4000 characters');
	});

	it('should return true when requested timeslot does not overlap with another oneOffTimeslot', async () => {
		const request = new OneOffTimeslotRequest();
		request.startDateTime = new Date('2021-03-02T00:00:00Z');
		request.endDateTime = DateHelper.addHours(request.startDateTime, 1);
		request.capacity = 2;
		request.serviceProviderId = 1;
		const oneOffTimeslotsValidation = Container.get(OneOffTimeslotsValidation);
		const result = await oneOffTimeslotsValidation.validateOneOffTimeslotsAvailability(request);
		expect(result).toBe(true);
	});

	it('should throw error when requested timeslot overlaps with another oneOffTimeslot', async () => {
		const request = new OneOffTimeslotRequest();
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
					capacity: 1,
				} as OneOffTimeslot,
			]),
		);

		const oneOffTimeslotsValidation = Container.get(OneOffTimeslotsValidation);
		const asyncTest = async () => await oneOffTimeslotsValidation.validateOneOffTimeslotsAvailability(request);
		await expect(asyncTest).rejects.toThrow('Slot cannot be created as it overlaps with an existing slot.');
	});
});
