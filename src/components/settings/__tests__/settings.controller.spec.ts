import { SettingsController } from '../settings.controller';
import { Container } from 'typescript-ioc';
import { SettingsServiceMock } from '../__mocks__/settings.service.mock';
import { SettingsService } from '../settings.service';
import { ConfigUtils } from 'mol-lib-common';

jest.mock('mol-lib-common', () => {
	const getBooleanValueFromEnv = jest.fn();

	const ConfigUtils = {
		getBooleanValueFromEnv,
	};

	return {
		ConfigUtils,
	};
});

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

	it('Should call hideEvents service', async () => {
		await Container.get(SettingsController).hideEvents();
		expect(ConfigUtils.getBooleanValueFromEnv).toBeCalledTimes(1);
	});
});
