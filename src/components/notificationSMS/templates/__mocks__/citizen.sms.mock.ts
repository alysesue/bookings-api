import { SMSBookingTemplate } from '../citizen.sms';
import { SMSmessage } from '../../notificationSMS.service';

export class SMSBookingTemplateMock implements SMSBookingTemplate {
	public static CancelledBookingSMSMock = jest.fn();
	public static CreatedBookingSMSMock = jest.fn();
	public static UpdatedBookingSMSMock = jest.fn();

	public CancelledBookingSMS(data): SMSmessage {
		return SMSBookingTemplateMock.CancelledBookingSMSMock(data);
	}
	public CreatedBookingSMS(data): SMSmessage {
		return SMSBookingTemplateMock.CreatedBookingSMSMock(data);
	}

	public UpdatedBookingSMS(data): SMSmessage {
		return SMSBookingTemplateMock.UpdatedBookingSMSMock(data);
	}
}
