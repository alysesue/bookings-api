import { pushIfNotPresent } from '../arrays';

describe('Test array tools', () => {
	it('Should push if not present', () => {
		const res = [];
		pushIfNotPresent(res, 'test');
		expect(res.includes('test')).toBe(true);
	});

	it('Should not push if present', () => {
		const res = ['test'];
		pushIfNotPresent(res, 'test');
		expect(res.length).toBe(1);
	});
});
