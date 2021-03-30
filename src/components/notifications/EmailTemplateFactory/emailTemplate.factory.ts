export abstract class EmailTemplateFactory {
	public abstract CreateCitizenEmailTemplateBase();
	public abstract CreateServiceProviderTemplateBase();
}

export abstract class EmailTemplateBase {
	public to: string;
	public subject: string;
	public body: string;
}

export abstract class CitizenEmailTemplateBase extends EmailTemplateBase {
    to: string;
    subject: string;
    body: string;
}

export abstract class ServiceProviderEmailTemplateBase implements EmailTemplateBase {
	to: string;
	subject: string;
	body: string;
}

export class CitizenBookingCreated extends CitizenEmailTemplateBase {
    public CitizenBookingCreatedEmail() {
        this.subject = '';
        this.body = '';
    }
}

export class ServiceProviderBookingCreated extends ServiceProviderEmailTemplateBase {
	public ServiceProviderBookingCreatedEmail() {
		this.subject = '';
		this.body = '';
	}
}

export class ServiceProviderBookingUpdated extends ServiceProviderEmailTemplateBase {
    public ServiceProviderBookingUpdatedEmail() {
        this.subject = '';
        this.body = '';
    }
}

export class ServiceProviderBookingCancelled extends ServiceProviderEmailTemplateBase {
    public ServiceProviderBookingCancelled() {
        this.subject = '';
        this.body = '';
    }
}



