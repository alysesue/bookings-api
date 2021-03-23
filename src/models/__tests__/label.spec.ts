import { LabelRequestModel } from '../../components/labels/label.apicontract';
import { Label } from '../entities';

describe('entities/label', () => {
	it('should convert label request to db label', () => {
		const request = new LabelRequestModel();
		request.id = 1;
		request.label = 'label1';

		const res = Label.creates([request]);

		expect(res).toHaveLength(1);
		expect(res[0].id).toBe(1);
		expect(res[0].labelText).toBe('label1');
	});

	it('should return empty array when request is empty', () => {
		const res = Label.creates([]);

		expect(res).toHaveLength(0);
	});

	it('should return empty array when request is undefined', () => {
		const res = Label.creates(undefined);

		expect(res).toHaveLength(0);
	});
});
