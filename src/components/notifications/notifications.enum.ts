export enum EmailNotificationTemplateType {
	CreatedByCitizenSentToCitizen = 1,
	UpdatedByCitizenSentToCitizen,
	CancelledByCitizenSentToCitizen,
	CreatedByCitizenSentToServiceProvider,
	UpdatedByCitizenSentToServiceProvider,
	CancelledByCitizenSentToServiceProvider,
	CreatedByServiceProviderSentToCitizen,
	UpdatedByServiceProviderSentToCitizen,
	CancelledByServiceProviderSentToCitizen,
	CreatedByServiceProviderSentToServiceProvider, // currently undefined
	UpdatedByServiceProviderSentToServiceProvider,
	CancelledByServiceProviderSentToServiceProvider,
	CreatedByCitizenSentToCitizenEvent,
	UpdatedByCitizenSentToCitizenEvent,
	CancelledByCitizenSentToCitizenEvent,
	CreatedByCitizenSentToServiceProviderEvent,
	UpdatedByCitizenSentToServiceProviderEvent,
	CancelledByCitizenSentToServiceProviderEvent,
	CreatedByServiceProviderSentToCitizenEvent,
	UpdatedByServiceProviderSentToCitizenEvent,
	CancelledByServiceProviderSentToCitizenEvent,
	CreatedByServiceProviderSentToServiceProviderEvent, // currently undefined
	UpdatedByServiceProviderSentToServiceProviderEvent,
	CancelledByServiceProviderSentToServiceProviderEvent,
}

export enum EmailRecipient {
	Citizen = 'citizen',
	ServiceProvider = 'service provider',
	ServiceAdmin = 'service admin',
}
