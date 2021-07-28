import { Controller, Post, Response, Route, Tags, Header } from 'tsoa';
import * as uuid from 'uuid';
import { Inject } from 'typescript-ioc';
import { BookingSGCookieHelper, MolCookieHelper } from '../../infrastructure/bookingSGCookieHelper';

@Route('v1/usersessions')
@Tags('Users')
export class UserSessionsController extends Controller {
	@Inject
	private cookieHelper: BookingSGCookieHelper;
	@Inject
	private molCookieHelper: MolCookieHelper;

	@Post('anonymous')
	@Response(204, 'Success')
	public async createAnonymous(@Header('x-booking-uuid') bookingUUID?: string): Promise<void> {
		const trackingId = uuid.v4();
		this.cookieHelper.setCookieValue({
			booking: bookingUUID,
			createdAt: new Date(),
			trackingId,
		});
		this.molCookieHelper.delete();

		this.setStatus(204);
	}
}
