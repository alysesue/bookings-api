import { Container } from 'typescript-ioc';
import { EncryptionService } from '../encryption.service';
import { EncryptionController } from '../encryption.controller';
import { IdHasher } from '../../../infrastructure/idHasher';
import { IdHasherMock } from '../../../infrastructure/__mocks__/idHasher.mock';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

describe('Encryption.Controller', () => {
	beforeEach(() => {
		Container.bind(EncryptionService).to(EncryptionServiceMock);
		Container.bind(IdHasher).to(IdHasherMock);
	});

	beforeEach(() => {
		jest.resetAllMocks();
		jest.clearAllMocks();
	});

	it('should call encrypt service', async () => {
		const controller = Container.get(EncryptionController);
		await controller.encrypt({ ah: 'ah' });
		expect(ServiceProvidersMock.encrypt).toHaveBeenCalled();
	});

	it('should call decrypt service', async () => {
		const controller = Container.get(EncryptionController);
		await controller.decrypt({ data: 'ss' });
		expect(ServiceProvidersMock.decrypt).toHaveBeenCalled();
	});

	it('should call hashid service', async () => {
		const controller = Container.get(EncryptionController);
		await controller.hashid(1);
		expect(IdHasherMock.encode).toHaveBeenCalled();
	});
});

const ServiceProvidersMock = {
	encrypt: jest.fn(),
	decrypt: jest.fn(),
};

class EncryptionServiceMock implements Partial<EncryptionService> {
	public encrypt(...params): Promise<string> {
		return ServiceProvidersMock.encrypt(...params);
	}
	public decrypt<T>(...params): T {
		return ServiceProvidersMock.decrypt(...params);
	}
}
