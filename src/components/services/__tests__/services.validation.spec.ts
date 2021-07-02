import { Organisation, Service } from '../../../models';
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

	it(`should allow only name`, async () => {
		const service = Service.create('svc', new Organisation());
		const validator = Container.get(ServicesValidation);
		await validator.validate(service);
	});

	it(`should allow only minDaysInAdvance`, async () => {
		const service = Service.create('svc', new Organisation());
		service.minDaysInAdvance = 10;

		const validator = Container.get(ServicesValidation);
		await validator.validate(service);
	});

	it(`should allow only maxDaysInAdvance`, async () => {
		const service = Service.create('svc', new Organisation());
		service.maxDaysInAdvance = 10;

		const validator = Container.get(ServicesValidation);
		await validator.validate(service);
	});

	it(`should validate maxDaysInAdvance when minDaysInAdvance exists`, async () => {
		const service = Service.create('svc', new Organisation());
		service.minDaysInAdvance = 10;
		service.maxDaysInAdvance = 5;

		const validator = Container.get(ServicesValidation);
		const asyncText = async () => await validator.validate(service);
		await expect(asyncText).rejects.toMatchInlineSnapshot(
			`[BusinessError: [10303] 'Max days in advance' value must be greater than 'min days in advance' value when present.]`,
		);
	});

	it(`should validate minDaysInAdvance`, async () => {
		const service = Service.create('svc', new Organisation());
		service.minDaysInAdvance = -1;

		const validator = Container.get(ServicesValidation);
		const asyncText = async () => await validator.validate(service);

		await expect(asyncText).rejects.toMatchInlineSnapshot(
			`[BusinessError: [10304] Invalid 'min days in advance' value.]`,
		);
	});

	it(`should validate maxDaysInAdvance`, async () => {
		const service = Service.create('svc', new Organisation());
		service.maxDaysInAdvance = -1;

		const validator = Container.get(ServicesValidation);
		const asyncText = async () => await validator.validate(service);

		await expect(asyncText).rejects.toMatchInlineSnapshot(
			`[BusinessError: [10305] Invalid 'max days in advance' value.]`,
		);
	});
});

class ServicesRepositoryMock implements Partial<ServicesRepository> {
	public static getService = jest.fn();

	public async getService(...params): Promise<any> {
		return await ServicesRepositoryMock.getService(...params);
	}
}
