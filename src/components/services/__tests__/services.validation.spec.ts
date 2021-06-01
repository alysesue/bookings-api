import { Container } from 'typescript-ioc';
import { ServicesRepository } from '../services.repository';
import { ServicesValidation } from '../services.validation';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

describe('Services validation tests', () => {
	beforeEach(() => {
		Container.bind(ServicesRepository).to(ServicesRepositoryMock);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it('should not enforce service id when optional', async () => {
		await Container.get(ServicesValidation).validateService(true);
		expect(ServicesRepositoryMock.getService).not.toHaveBeenCalled();
	});

	it('should verify service id exists when optional', async () => {
		ServicesRepositoryMock.getService.mockReturnValue(Promise.resolve({}));
		await Container.get(ServicesValidation).validateService(true, 1);
		expect(ServicesRepositoryMock.getService).toHaveBeenCalled();
	});

	it('should verify service id exists when mandatory', async () => {
		ServicesRepositoryMock.getService.mockReturnValue(Promise.resolve({}));
		await Container.get(ServicesValidation).validateService(false, 1);
		expect(ServicesRepositoryMock.getService).toHaveBeenCalled();
	});

	it(`should throw when service id doesn't exist (optional)`, async () => {
		ServicesRepositoryMock.getService.mockReturnValue(Promise.resolve(null));
		const test = async () => await Container.get(ServicesValidation).validateService(true, 0);

		await expect(test).rejects.toThrowError();
	});

	it(`should throw when service id doesn't exist (mandatory)`, async () => {
		ServicesRepositoryMock.getService.mockReturnValue(Promise.resolve(null));
		const test = async () => await Container.get(ServicesValidation).validateService(false, 0);

		await expect(test).rejects.toThrowError();
	});
});

class ServicesRepositoryMock implements Partial<ServicesRepository> {
	public static getService = jest.fn();

	public async getService(...params): Promise<any> {
		return await ServicesRepositoryMock.getService(...params);
	}
}
