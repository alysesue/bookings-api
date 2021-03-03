import { Container } from 'typescript-ioc';
import { EncryptionService } from '../encryption.service';
import { EncryptionController } from '../encryption.controller';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

describe('Encryption.Controller', () => {
	beforeEach(() => {
		Container.bind(EncryptionService).to(EncryptionServiceMock);
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
