import { InRequestScope } from 'typescript-ioc';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { RepositoryBase } from '../../core/repository';
import { Setting, SettingData } from '../../models/entities/setting';

@InRequestScope
export class SettingsRepository extends RepositoryBase<Setting> {
	constructor() {
		super(Setting);
	}

	public async getSettings(): Promise<SettingData> {
		const repository = await this.getRepository();
		const settings = await repository.findOne();
		if (!settings || !settings.data)
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage(`Setting not found.`);
		return settings.data;
	}
}
