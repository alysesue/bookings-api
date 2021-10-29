import { EmailBookingTemplate, EmailTemplateBase } from '../citizen.mail';

export class EmailBookingTemplateMock extends EmailBookingTemplate {
	public static CancelledBookingEmailMock = jest.fn();
	public static CreatedBookingEmailMock = jest.fn();
	public static UpdatedBookingEmailMock = jest.fn();
	public static ApprovedBySABookingEmailMock = jest.fn();

	public CancelledBookingEmail(data): Promise<EmailTemplateBase> {
		return EmailBookingTemplateMock.CancelledBookingEmailMock(data);
	}
	public CreatedBookingEmail(data): Promise<EmailTemplateBase> {
		return EmailBookingTemplateMock.CreatedBookingEmailMock(data);
	}

	public UpdatedBookingEmail(data): Promise<EmailTemplateBase> {
		return EmailBookingTemplateMock.UpdatedBookingEmailMock(data);
	}
	public ApprovedBySABookingEmail(data): Promise<EmailTemplateBase> {
		return EmailBookingTemplateMock.ApprovedBySABookingEmailMock(data);
	}
}
