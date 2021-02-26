import { Inject, InRequestScope } from 'typescript-ioc';
import { SettingsRepository } from './settings.repository';
import { SettingData } from '../../models/entities/setting';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { verifyUrl } from '../../tools/url';

@InRequestScope
export class SettingsService {
	@Inject
	private settingsRepository: SettingsRepository;

	private verifySettingSetupCorrectly(setting: SettingData): void {
		if (!setting.redirectionWhitelistedUrl)
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage(`Setting whitelist redirection not set`);
	}

	public async verifyUrlRedirection(urlString: string): Promise<boolean> {
		const setting: SettingData = await this.settingsRepository.getSettings();
		const url = verifyUrl(urlString);
		this.verifySettingSetupCorrectly(setting);
		const urlParse = `${url.protocol}//${url.hostname}${url.pathname}`;
		return setting.redirectionWhitelistedUrl.includes(urlParse);
	}
}

export type VerifyUrlOption = {
	checkWhitelistCitizenBackUrl?: boolean;
	checkWhitelistCitizenRedirectBooked?: boolean;
};
