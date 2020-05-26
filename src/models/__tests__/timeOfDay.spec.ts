import { TimeOfDay } from '../TimeOfDay';

describe('Time of day tests', () => {
	it('should calculate diff in minutes', () => {
		const timeA = TimeOfDay.parse('08:30');
		const timeB = TimeOfDay.parse('09:01');

		const diff = TimeOfDay.DiffInMinutes(timeB, timeA);
		const diffInverse = TimeOfDay.DiffInMinutes(timeA, timeB);

		expect(diff).toBe(31);
		expect(diffInverse).toBe(-31);
	});
});
