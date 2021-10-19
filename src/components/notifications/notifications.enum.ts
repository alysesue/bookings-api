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
}

export enum EmailRecipient {
	Citizen = 'citizen',
	ServiceProvider = 'service provider',
}
