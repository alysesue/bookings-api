import { QueryRunner } from 'typeorm';
import { Setting } from '../../models/entities';
import { SettingData } from '../../models/entities/setting';
import { pushIfNotPresent } from '../../tools/arrays';
import { getConfig } from '../../config/app-config';

export const initPopulateDB = async (queryRunner: QueryRunner) => {
	const conf = getConfig();

	async function populateWhitelistURLRedirection() {
		const settings: Setting[] = await queryRunner.query(`SELECT "setting"."_data" FROM "setting"  WHERE "_id" = 1`);
		const setting: SettingData = settings[0]?.data || ({} as SettingData);
		const newRedirectionWhitelistedUrl = setting?.redirectionWhitelistedUrl || [];
		conf.urlRedirectionWhitelist.forEach((s) => pushIfNotPresent(newRedirectionWhitelistedUrl, s));
		setting.redirectionWhitelistedUrl = newRedirectionWhitelistedUrl;
		const settingJSON = JSON.stringify(setting);
		if (settings.length) {
			// tslint:disable-next-line:tsr-detect-sql-literal-injection
			await queryRunner.query(`UPDATE "setting" SET "_data"=('${settingJSON}') WHERE "_id" = 1`);
			// tslint:disable-next-line:tsr-detect-sql-literal-injection
		} else await queryRunner.query(`INSERT INTO "setting" ("_data") VALUES ('${settingJSON}')`);
	}

	await populateWhitelistURLRedirection();
};
