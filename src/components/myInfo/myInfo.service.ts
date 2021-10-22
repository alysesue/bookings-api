import { get } from '../../tools/fetch';
import { Inject, InRequestScope } from 'typescript-ioc';
import { User } from '../../models/entities';
import { logger } from 'mol-lib-common';
import { getConfig } from '../../config/app-config';
import { MyInfoWrapperResponse, MyInfoResponse } from '../../models/myInfoTypes';
import { MOLAuthType, MOLSecurityHeaderKeys } from 'mol-lib-api-contract/auth';
import { infoRawMock } from './__mocks__/infoRaw.mock';

export abstract class MyInfoService {
	public async getMyInfo(user: User): Promise<MyInfoResponse | undefined> {
		if (!user.isSingPass()) {
			return undefined;
		}

		return await this.getInfoRaw(user._singPassUser.UinFin);
	}

	protected abstract getInfoRaw(nric: string): Promise<MyInfoResponse | undefined>;
}

@InRequestScope
export class MyInfoServiceMol extends MyInfoService {
	protected async getInfoRaw(nric: string): Promise<MyInfoResponse | undefined> {
		const header = {
			[MOLSecurityHeaderKeys.AUTH_TYPE]: MOLAuthType.SYSTEM,
		};
		const config = getConfig();
		const path = config.molRouteMyInfo.url + `/api/v1/info-raw?nric=${nric}`;

		try {
			const response = await get<MyInfoWrapperResponse>(path, undefined, header);
			return response.data;
		} catch (error) {
			logger.error(error);
		}
		return undefined;
	}
}

@InRequestScope
export class MyInfoServiceLocal extends MyInfoService {
	protected async getInfoRaw(_nric: string): Promise<MyInfoResponse | undefined> {
		return infoRawMock(_nric);
	}
}

@InRequestScope
export class MyInfoServiceFactory {
	@Inject
	private _molService: MyInfoServiceMol;
	@Inject
	private _localService: MyInfoServiceLocal;

	public getService(): MyInfoService {
		return getConfig().isLocal ? this._localService : this._molService;
	}
}
