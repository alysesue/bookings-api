import { ServiceProvider } from '../index';

describe('Should test serviceProvider', () => {
	it('Should test asyncValidate', async () => {
		const sp = ServiceProvider.create('aa', 1, 'cc', 'bb');
		const errs = [];
		for await (const err of sp.asyncValidate()) {
			errs.push(err);
		}
		expect(errs[0]._message).toBe('For service provider: aa. Phone number is invalid: bb.');
		expect(errs[1]._message).toBe('For service provider: aa. Email is invalid: cc.');
	});
});
