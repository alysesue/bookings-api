import { Body, Controller, Header, Post, Response, Route, SuccessResponse, Tags } from 'tsoa';
import { Inject, InRequestScope } from 'typescript-ioc';
import { ApiData, ApiDataFactory } from '../../apicontract';
import { EncryptionService } from './encryption.service';
import { BookingSGAuth } from '../../infrastructure/decorators/bookingSGAuth';
import { MOLUserAuthLevel } from 'mol-lib-api-contract/auth';

@InRequestScope
@Route('v1/encryption')
@Tags('Encryption')
export class EncryptionController extends Controller {
	@Inject
	private encryptionService: EncryptionService;

	/**
	 * Encrypt the body
	 *
	 * @param request
	 * The `signature-singpass-user` header is optional, if set to true, a signature is add to the crypted message<br/>
	 * At the decrypt process, it will verify that the unifin is the request object is the same as the one in the session<br/>
	 * e.g. "signature-singpass-user": "true"
	 */
	@Post('encrypt')
	@BookingSGAuth({ bypassAuth: true })
	@SuccessResponse(200, 'Ok')
	public async encrypt(
		@Body() request: any,
		@Header('signature-singpass-user') SignatureSingpassUser?: string,
	): Promise<ApiData<string>> {
		// tslint:disable-next-line:tsr-detect-possible-timing-attacks
		return ApiDataFactory.create(await this.encryptionService.encrypt(request, SignatureSingpassUser === 'true'));
	}

	/**
	 * Decrypt the body
	 *
	 * @param request
	 */
	@Post('decrypt')
	@BookingSGAuth({ admin: {}, agency: {}, user: { minLevel: MOLUserAuthLevel.L2 }, anonymous: { requireOtp: false } })
	@SuccessResponse(200, 'Ok')
	@Response(401, 'Valid authentication types: [admin,agency,user,anonymous]')
	public async decrypt(@Body() request: { data: string }): Promise<ApiData<string>> {
		return ApiDataFactory.create(await this.encryptionService.decrypt(request.data));
	}
}
