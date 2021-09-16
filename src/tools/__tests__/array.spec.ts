import { pushIfNotPresent, randomIndex, uniqBy } from '../arrays';

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

	it('Should return random index', () => {
		for (let i = 0; i < 50; i++) {
			const random = randomIndex([1, 2, 3]);
			expect(random === 1 || random === 2 || random === 0).toBe(true);
		}
	});

	it('Should return uniqById', () => {
		const objs = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 1 }];
		expect(uniqBy(objs, (a) => a.id).length).toBe(3);
	});
});
