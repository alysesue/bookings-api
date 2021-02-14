import { SettingsService } from '../settings.service';

export class SettingsServiceMock implements Partial<SettingsService> {
	public static verifyUrlRedirectionMock = jest.fn();

	public async verifyUrlRedirection(...props): Promise<boolean> {
		return SettingsServiceMock.verifyUrlRedirectionMock(...props);
	}
}
