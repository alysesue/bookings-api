import { SettingsRepository } from '../settings.repository';
import { SettingData } from '../../../models/entities/setting';

export class SettingsRepositoryMock implements Partial<SettingsRepository> {
	public static getSettingsMock = jest.fn();
	public async getSettings(...props): Promise<SettingData> {
		return SettingsRepositoryMock.getSettingsMock(...props);
	}
}
