import { Body, Controller, Header, Post, Route, SuccessResponse, Tags } from 'tsoa';
import { Inject, InRequestScope } from 'typescript-ioc';
import { ApiData, ApiDataFactory } from '../../apicontract';
import { EncryptionService } from './encryption.service';

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
	@SuccessResponse(200, 'Ok')
	public async decrypt(@Body() request: { data: string }): Promise<ApiData<string>> {
		return ApiDataFactory.create(await this.encryptionService.decrypt(request.data));
	}
}
