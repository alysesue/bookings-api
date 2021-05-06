import { OneOffTimeslotsBusinessValidation, OneOffTimeslotsValidation } from '../oneOffTimeslots.validation';
import { Container } from 'typescript-ioc';
import { OneOffTimeslot } from '../../../models';
import { OneOffTimeslotRequest } from '../oneOffTimeslots.apicontract';
import { DateHelper } from '../../../infrastructure/dateHelper';
import { OneOffTimeslotsRepository } from '../oneOffTimeslots.repository';
import { OneOffTimeslotsRepositoryMock } from '../__mocks__/oneOffTimeslots.mock';

describe('Validation of oneOffTimeslots', () => {
	beforeAll(() => {
		Container.bind(OneOffTimeslotsRepository).to(OneOffTimeslotsRepositoryMock);
	});
	beforeEach(() => {
		OneOffTimeslotsRepositoryMock.searchBookings.mockImplementation(() =>
			Promise.resolve([{}] as OneOffTimeslot[]),
		);
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
		const validate = oneOffTimeslotsValidation.validate(oneOffTimeslot);
		await expect(validate).rejects.toThrow('Start time must be less than end time');
		await expect(validate).rejects.toThrow('[10101] Title word limit is 100 characters');
		await expect(validate).rejects.toThrow('[10103] Description word limit is 4000 characters');
	});

	it('should return true when requested timeslot does not overlap with another oneOffTimeslot', async () => {
		const oneOffTimeslotsBusinessValidation = Container.get(OneOffTimeslotsBusinessValidation);
		const request = new OneOffTimeslotRequest();
		request.startDateTime = new Date('2021-03-02T00:00:00Z');
		request.endDateTime = DateHelper.addHours(request.startDateTime, 1);
		request.capacity = 2;
		request.serviceProviderId = 1;
		const result = oneOffTimeslotsBusinessValidation.validateOneOffTimeslotsAvailability(request);
		expect(result).toBeTruthy();
	});

	it('should throw error when requested timeslot overlaps with another oneOffTimeslot', async () => {
		const oneOffTimeslotsBusinessValidation = Container.get(OneOffTimeslotsBusinessValidation);
		const request = new OneOffTimeslotRequest();
		request.startDateTime = new Date('2021-03-02T00:00:00Z');
		request.endDateTime = new Date('2021-03-02T01:00:00Z');
		request.capacity = 2;
		request.serviceProviderId = 1;
		await expect(oneOffTimeslotsBusinessValidation.validateOneOffTimeslotsAvailability(request)).rejects.toThrow(
			'Slot cannot be created as it overlaps with an existing slot.',
		);
	});
});
