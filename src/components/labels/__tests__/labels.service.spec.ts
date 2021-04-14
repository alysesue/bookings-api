import { Container } from 'typescript-ioc';
import { LabelsRepository } from '../labels.repository';
import { LabelsRepositoryMock } from '../__mocks__/labels.repository.mock';
import { Label } from '../../../models/entities';
import { LabelsService } from '../labels.service';
import { IdHasher } from '../../../infrastructure/idHasher';

describe('Test labels service', () => {
	beforeAll(() => {
		jest.resetAllMocks();
		Container.bind(LabelsRepository).to(LabelsRepositoryMock);
		Container.bind(IdHasher).to(IdHasherMock);
	});

	beforeEach(() => {
		jest.resetAllMocks();

		IdHasherMock.encode.mockImplementation((value: number) => value.toString());
		IdHasherMock.decode.mockImplementation((value: string) => Number.parseInt(value, 10));
	});

	it('Should skip if array is empty', async () => {
		LabelsRepositoryMock.findMock.mockReturnValue([]);
		const resLabel = await Container.get(LabelsService).verifyLabels([], 2);

		expect(LabelsRepositoryMock.findMock).not.toBeCalled();
		expect(resLabel).toStrictEqual([]);
	});

	it('Should skip if array is undefined', async () => {
		LabelsRepositoryMock.findMock.mockReturnValue([]);
		const resLabel = await Container.get(LabelsService).verifyLabels(undefined, 2);

		expect(LabelsRepositoryMock.findMock).not.toBeCalled();
		expect(resLabel).toStrictEqual([]);
	});

	it('Should verify if labels are present in Service & remove duplication', async () => {
		const labelIds = ['1', '1', '2'];

		LabelsRepositoryMock.findMock.mockReturnValue([Label.create('ABC1', 1), Label.create('ABC2', 2)]);
		const resLabel = await Container.get(LabelsService).verifyLabels(labelIds, 2);
		expect(LabelsRepositoryMock.findMock).toHaveBeenCalledTimes(1);

		expect(resLabel).toStrictEqual([Label.create('ABC1', 1), Label.create('ABC2', 2)]);
	});

	it(`Should throw if label id doesn't exist`, async () => {
		const labelIds = ['1', '1', '2'];

		LabelsRepositoryMock.findMock.mockReturnValue([Label.create('ABC2', 2), Label.create('ABC3', 3)]);
		const service = Container.get(LabelsService);
		const asyncTest = () => service.verifyLabels(labelIds, 2);

		await expect(asyncTest).rejects.toThrowErrorMatchingInlineSnapshot(`"Invalid label id: 1"`);
	});
});

class IdHasherMock implements Partial<IdHasher> {
	public static encode = jest.fn();
	public static decode = jest.fn();
	public encode(id: number): string {
		return IdHasherMock.encode(id);
	}

	public decode(id: string): number {
		return IdHasherMock.decode(id);
	}
}
