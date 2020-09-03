import { Container } from 'typescript-ioc';
import { ServicesService } from '../services.service';
import { ServicesValidation } from '../services.validation';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

describe('Services validation tests', () => {
	beforeEach(() => {
		Container.bind(ServicesService).to(ServicesServiceMock);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it('should not enforce service id when optional', async () => {
		await Container.get(ServicesValidation).validate(true);
		expect(ServicesServiceMock.getService).not.toHaveBeenCalled();
	});

	it('should verify service id exists when optional', async () => {
		ServicesServiceMock.getService.mockReturnValue(Promise.resolve({}));
		await Container.get(ServicesValidation).validate(true, 1);
		expect(ServicesServiceMock.getService).toHaveBeenCalled();
	});

	it('should verify service id exists when mandatory', async () => {
		ServicesServiceMock.getService.mockReturnValue(Promise.resolve({}));
		await Container.get(ServicesValidation).validate(false, 1);
		expect(ServicesServiceMock.getService).toHaveBeenCalled();
	});

	it(`should throw when service id doesn't exist (optional)`, async () => {
		ServicesServiceMock.getService.mockReturnValue(Promise.resolve(null));
		const test = async () => await Container.get(ServicesValidation).validate(true, 0);

		await expect(test).rejects.toThrowError();
	});

	it(`should throw when service id doesn't exist (mandatory)`, async () => {
		ServicesServiceMock.getService.mockReturnValue(Promise.resolve(null));
		const test = async () => await Container.get(ServicesValidation).validate(false, 0);

		await expect(test).rejects.toThrowError();
	});
});

class ServicesServiceMock extends ServicesService {
	public static getService = jest.fn();

	public async getService(...params): Promise<any> {
		return await ServicesServiceMock.getService(...params);
	}
}
