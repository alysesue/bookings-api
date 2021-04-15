import { OneOffTimeslotsValidation } from '../oneOffTimeslots.validation';
import { Container } from 'typescript-ioc';
import { OneOffTimeslot } from '../../../models';

describe('Validation of oneOffTimeslots', () => {
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
});
