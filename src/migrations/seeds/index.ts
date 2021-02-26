import { QueryRunner } from 'typeorm';
import { Setting } from '../../models/entities';
import { SettingData } from '../../models/entities/setting';
import { pushIfNotPresent } from '../../tools/arrays';
import { getConfig } from '../../config/app-config';

export const initPopulateDB = async (queryRunner: QueryRunner) => {
	const conf = getConfig();

	const getWhitelistURLRedirection = () => {
		const whitelists = [];
		if (['dev', 'e2e', 'local', 'qe', 'stg'].includes(conf.bookingEnv)) {
			whitelists.push('https://www.google.com/');
			whitelists.push('https://gccdev-inter.romomj.com/civil/marriage-process/booking');
			whitelists.push('https://gccdev-inter.romomj.com/civil/marriage-process/confirmation');
			whitelists.push('https://gccsit-inter.romomj.com/civil/marriage-process/booking');
			whitelists.push('https://gccsit-inter.romomj.com/civil/marriage-process/confirmation');
			whitelists.push('https://gccuat-inter.marriage.gov.sg/civil/marriage-process/booking');
			whitelists.push('https://gccuat-inter.marriage.gov.sg/civil/marriage-process/confirmation');
		}
		if (conf.bookingEnv === 'production') {
			whitelists.push('https://www.marriage.gov.sg/civil/marriage-process/booking');
			whitelists.push('https://www.marriage.gov.sg/civil/marriage-process/confirmation');
		}
		return whitelists;
	};

	const populateWhitelistURLRedirection = async () => {
		const settings: Setting[] = await queryRunner.query(`SELECT "setting"."_data" FROM "setting"  WHERE "_id" = 1`);
		const setting: SettingData = settings[0]?.data || ({} as SettingData);
		const newRedirectionWhitelistedUrl = setting?.redirectionWhitelistedUrl || [];
		getWhitelistURLRedirection().forEach((s) => pushIfNotPresent(newRedirectionWhitelistedUrl, s));
		setting.redirectionWhitelistedUrl = newRedirectionWhitelistedUrl;
		const settingJSON = JSON.stringify(setting);
		if (settings.length) {
			// tslint:disable-next-line:tsr-detect-sql-literal-injection
			await queryRunner.query(`UPDATE "setting" SET "_data"=('${settingJSON}') WHERE "_id" = 1`);
			// tslint:disable-next-line:tsr-detect-sql-literal-injection
		} else await queryRunner.query(`INSERT INTO "setting" ("_data") VALUES ('${settingJSON}')`);
	};

	await populateWhitelistURLRedirection();
};
