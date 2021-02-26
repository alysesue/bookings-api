import { SettingsRepository } from '../settings.repository';
import { SettingsRepositoryMock } from '../__mocks__/settings.repository.mock';
import { Container } from 'typescript-ioc';
import { SettingsService } from '../settings.service';

describe('Test settings service', () => {
	beforeAll(() => {
		Container.bind(SettingsRepository).to(SettingsRepositoryMock);
	});

	const settings = {
		redirectionWhitelistedUrl: ['https://dev.google.com/path', 'https://www.google.com/'],
	};
	const url = 'https://dev.google.com/path?test=3';

	beforeEach(() => {
		SettingsRepositoryMock.getSettingsMock.mockReturnValue(settings);
	});

	it('Should send error if no setting', async () => {
		SettingsRepositoryMock.getSettingsMock.mockReturnValue({});
		try {
			const res = await Container.get(SettingsService).verifyUrlRedirection(url);
			expect(res).toBeFalsy();
		} catch (e) {
			expect(e.message).toBe('Setting whitelist redirection not set');
		}
	});

	it('Should return true', async () => {
		SettingsRepositoryMock.getSettingsMock.mockReturnValue(settings);
		let res = await Container.get(SettingsService).verifyUrlRedirection(url);
		expect(res).toBeTruthy();
		res = await Container.get(SettingsService).verifyUrlRedirection('https://www.google.com');
		expect(res).toBeTruthy();
	});
});
