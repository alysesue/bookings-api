import { get } from '../../tools/fetch';
import { InRequestScope } from 'typescript-ioc';
import { User } from '../../models/entities';
import { logger } from 'mol-lib-common';
import { getConfig } from '../../config/app-config';
import { MyInfoResponse } from '../../models/myInfoTypes';

@InRequestScope
export class MyInfoService {
	public async getMyInfo(user: User): Promise<MyInfoResponse | undefined> {
		if (!user.isCitizen()) {
			return undefined;
		}
		const header = { 'mol-auth-type': 'SYSTEM' };
		const config = getConfig();
		const path = config.molRouteMyInfo.url + `/api/v1/info-raw?nric=${user._singPassUser.UinFin}`;

		try {
			return await get(path, undefined, header);
		} catch (error) {
			logger.error(error);
		}
		return undefined;
	}
}
