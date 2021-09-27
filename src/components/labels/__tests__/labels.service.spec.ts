import { Container } from 'typescript-ioc';
import { LabelsRepository } from '../labels.repository';
import { LabelsRepositoryMock } from '../__mocks__/labels.repository.mock';
import { Label, Organisation, Service } from '../../../models/entities';
import { LabelsService } from '../labels.service';
import { IdHasher } from '../../../infrastructure/idHasher';
import { ServiceProviderLabelsRepositoryMock } from '../../../components/serviceProvidersLabels/__mock__/serviceProvidersLabels.repository.mock';

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
	const service = new Service();
	service.labels = [];
	service.categories = [];

	it('Should skip if array is empty', async () => {
		LabelsRepositoryMock.findMock.mockReturnValue([]);
		const resLabel = await Container.get(LabelsService).verifyLabels([], service);

		expect(resLabel).toStrictEqual([]);
	});

	it('Should throw if labels undefined', async () => {
		LabelsRepositoryMock.findMock.mockReturnValue([]);
		const resLabel = Container.get(LabelsService).verifyLabels(['1'], new Service());

		await expect(resLabel).rejects.toThrowError('required');
	});

	it('Should verify if labels are present in Service & remove duplication', async () => {
		const labelIds = ['1', '1', '2'];

		const service = new Service();
		service.labels = [Label.create('ABC1', 1), Label.create('ABC2', 2)];
		service.categories = [];
		const resLabel = await Container.get(LabelsService).verifyLabels(labelIds, service);

		expect(resLabel).toStrictEqual([Label.create('ABC1', 1), Label.create('ABC2', 2)]);
	});

	it(`Should throw if label id doesn't exist`, async () => {
		const labelIds = ['1', '1', '2'];

		const asyncTest = Container.get(LabelsService).verifyLabels(labelIds, service);
		await expect(asyncTest).rejects.toThrowErrorMatchingInlineSnapshot(`"Invalid label id: 1"`);
	});

	it(`Should keep labels`, async () => {
		const label1 = Label.create('test', 1);
		const { movedLabelsToNoCategory, deleteLabels } = Container.get(LabelsService).sortLabelForDeleteCategory(
			[label1],
			[label1],
		);
		expect(movedLabelsToNoCategory.length).toBe(1);
		expect(deleteLabels.length).toBe(0);
	});

	it(`Should delete labels`, async () => {
		const label1 = Label.create('test', 1);
		const { movedLabelsToNoCategory, deleteLabels } = Container.get(LabelsService).sortLabelForDeleteCategory(
			[],
			[label1],
		);
		expect(movedLabelsToNoCategory.length).toBe(0);
		expect(deleteLabels.length).toBe(1);
	});

	it(`Should merge all labels`, async () => {
		const label1 = Label.create('test', 1);
		const label2 = Label.create('test', 2);
		(LabelsRepositoryMock.saveMock as jest.Mock).mockReturnValue([label2]);
		const service = Service.create('name', {} as Organisation, [label1]);
		service.setIsSpAutoAssigned(true);

		const resAllLabel = await Container.get(LabelsService).updateLabelToNoCategory([label2], service);
		expect(LabelsRepositoryMock.saveMock).toBeCalledTimes(1);
		expect(resAllLabel).toStrictEqual([label1, label2]);
	});

	it(`Should sort label moved and label to delete`, async () => {
		const label1 = Label.create('test', 1);
		const label2 = Label.create('test', 2);
		const resAllLabel = await Container.get(LabelsService).sortLabelForDeleteCategory([label2], [label1, label2]);
		expect(resAllLabel.deleteLabels).toStrictEqual([label1]);
		expect(resAllLabel.movedLabelsToNoCategory).toStrictEqual([label2]);
	});

	describe('delete API', () => {
		it('delete service label', async () => {
			const label = Label.create('English', 1);
			await Container.get(LabelsService).delete([label]);
			expect(LabelsRepositoryMock.deleteMock).toBeCalledTimes(1);
			expect(ServiceProviderLabelsRepositoryMock.deleteMock).not.toBeCalled();
		});
	});

	describe('update API', () => {
		it('update service label', async () => {
			const label = Label.create('English', 1);
			await Container.get(LabelsService).update([label]);
			expect(LabelsRepositoryMock.saveMock).toBeCalledTimes(1);
			expect(ServiceProviderLabelsRepositoryMock.saveMock).not.toBeCalled();
		});
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
