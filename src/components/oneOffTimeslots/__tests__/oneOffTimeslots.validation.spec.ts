import { OneOffTimeslotsValidation } from '../oneOffTimeslots.validation';
import { Container } from 'typescript-ioc';
import { OneOffTimeslot } from '../../../models/entities';

describe('Validation of oneOffTimeslots', () => {
	it('Should return ', async () => {
		const oneOffTimeslot = new OneOffTimeslot();
		oneOffTimeslot.startDateTime = new Date('2021-03-02T00:00:00Z');
		oneOffTimeslot.endDateTime = new Date('2021-03-02T00:00:00Z');
		oneOffTimeslot.title = '';
		oneOffTimeslot.description = '';
		const oneOffTimeslotsValidation = Container.get(OneOffTimeslotsValidation);
		const validate = await oneOffTimeslotsValidation.validate(oneOffTimeslot);
		await expect(validate).rejects.toBe('');
	});
});
