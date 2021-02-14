import { SettingsController } from '../settings.controller';
import { Container } from 'typescript-ioc';
import { SettingsServiceMock } from '../__mocks__/settings.service.mock';
import { SettingsService } from '../settings.service';

describe('Test setting controller', () => {
	afterAll(() => {
		jest.resetAllMocks();
		if (global.gc) global.gc();
	});

	beforeAll(() => {
		Container.bind(SettingsService).to(SettingsServiceMock);
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	it('Should call setting service', async () => {
		await Container.get(SettingsController).verifyUrl('');
		expect(SettingsServiceMock.verifyUrlRedirectionMock).toBeCalledTimes(1);
	});
});
