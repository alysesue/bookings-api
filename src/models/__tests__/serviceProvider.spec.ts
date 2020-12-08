import { ServiceProvider } from '../index';

describe('Should test serviceProvider', () => {
	it('Should test asyncValidate', async () => {
		const sp = ServiceProvider.create('aa', undefined, 'cc', 'bb');
		const errs = [];
		for await (const err of sp.asyncValidate()) {
			errs.push(err);
		}
		expect(errs[0]._message).toBe('For service provider: aa. Service not found');
	});
});
