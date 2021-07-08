import { get } from '../../tools/fetch';
import { InRequestScope } from 'typescript-ioc';
import { User } from '../../models/entities';
import { logger } from 'mol-lib-common';
import { getConfig } from '../../config/app-config';

@InRequestScope
export class MyInfoService {
	private config = getConfig();

	public async getMyInfo(user: User) {
		if (!user.isCitizen()) {
			return;
		}
		const header = { 'mol-auth-type': 'SYSTEM' };
		const path = this.config.molRouteMyInfo.url + `/api/v1/info-raw?nric=${user._singPassUser.UinFin}`;

		try {
			return await get(path, undefined, header);
		} catch (error) {
			logger.error(error);
		}
		return;
	}
}
