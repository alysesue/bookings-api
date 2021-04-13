import { Container } from 'typescript-ioc';
import { LabelsMapper } from '../labels.mapper';
import { Label } from '../../../models/entities';
import { IdHasher } from '../../../infrastructure/idHasher';
import { LabelRequestModel } from '../label.apicontract';

beforeAll(() => {
	Container.bind(IdHasher).to(IdHasherMock);
});

describe('labels/labels.mapper', () => {
	it('should map labels data to LabelResponseModel', () => {
		const labels = [createLabelData(12, 'label1'), createLabelData(13, 'label2')];
		const mapper = Container.get(LabelsMapper);

		IdHasherMock.encode.mockImplementation((id) => String(id));

		const transformedLabels = mapper.mapToLabelsResponse(labels);

		expect(transformedLabels).toHaveLength(2);
		expect(transformedLabels[0].id).toBe('12');
		expect(transformedLabels[0].label).toBe('label1');
	});

	it('should return empty labels response array when no data is provided', () => {
		const mapper = Container.get(LabelsMapper);

		const transformedLabels = mapper.mapToLabelsResponse();

		expect(transformedLabels).toHaveLength(0);
	});

	it('should map labelRequestModel to Label data', () => {
		const labelRequest = [createLabelRequestData('12', 'label1'), createLabelRequestData('13', 'label2')];
		const mapper = Container.get(LabelsMapper);

		IdHasherMock.decode.mockImplementation((id) => Number(id));

		const transformedLabelRequest = mapper.mapToLabels(labelRequest);

		expect(transformedLabelRequest).toHaveLength(2);
		expect(transformedLabelRequest[1].id).toBe(13);
		expect(transformedLabelRequest[1].labelText).toBe('label2');
	});

	it('should return empty labels array when no request data is provided', () => {
		const mapper = Container.get(LabelsMapper);

		const transformedLabels = mapper.mapToLabels();

		expect(transformedLabels).toHaveLength(0);
	});

	it('create a new label', () => {
		const mapper = Container.get(LabelsMapper);
		const existingLabels = [Label.create('label1', 1)];

		const mergedLabels = mapper.mergeLabels(existingLabels, [Label.create('label1', 1), Label.create('label2')]);

		expect(mergedLabels).toHaveLength(2);
	});

	it('create a new label and remove existing labels', () => {
		const mapper = Container.get(LabelsMapper);
		const existingLabels = [Label.create('Chinese', 1), Label.create('English', 2)];

		const mergedLabels = mapper.mergeLabels(existingLabels, [Label.create('Tamil')]);

		expect(mergedLabels).toHaveLength(1);
	});

	it('should update a new label', () => {
		const mapper = Container.get(LabelsMapper);
		const existingLabels = [Label.create('label1', 2), Label.create('label2', 1)];

		const mergedLabels = mapper.mergeLabels(existingLabels, [Label.create('label1', 2), Label.create('label3', 1)]);

		expect(mergedLabels).toHaveLength(2);
		expect(mergedLabels[1].labelText).toEqual('label3');
	});

	it('should delete a label', () => {
		const mapper = Container.get(LabelsMapper);
		const existingLabels = [Label.create('label1', 2), Label.create('label2', 1)];

		const mergedLabels = mapper.mergeLabels(existingLabels, [Label.create('label3', 1)]);

		expect(mergedLabels).toHaveLength(1);
		expect(mergedLabels[0].labelText).toEqual('label3');
	});

	const createLabelData = (id: number, text: string) => {
		const entity = new Label();
		entity.id = id;
		entity.labelText = text;

		return entity;
	};

	const createLabelRequestData = (id: string, text: string) => {
		const request = new LabelRequestModel();
		request.id = id;
		request.label = text;

		return request;
	};
});

export class IdHasherMock implements Partial<IdHasher> {
	public static encode = jest.fn();
	public static decode = jest.fn();
	public encode(id: number): string {
		return IdHasherMock.encode(id);
	}

	public decode(id: string): number {
		return IdHasherMock.decode(id);
	}
}
