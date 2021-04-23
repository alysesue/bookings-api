import { EmailBookingTemplate, EmailTemplateBase } from '../citizen.mail';

export class EmailBookingTemplateMock implements EmailBookingTemplate {
	public static CancelledBookingEmailMock = jest.fn();
	public static CreatedBookingEmailMock = jest.fn();
	public static UpdatedBookingEmailMock = jest.fn();

	public CancelledBookingEmail(data): EmailTemplateBase {
		return EmailBookingTemplateMock.CancelledBookingEmailMock(data);
	}
	public CreatedBookingEmail(data): EmailTemplateBase {
		return EmailBookingTemplateMock.CreatedBookingEmailMock(data);
	}

	public UpdatedBookingEmail(data): EmailTemplateBase {
		return EmailBookingTemplateMock.UpdatedBookingEmailMock(data);
	}
}
