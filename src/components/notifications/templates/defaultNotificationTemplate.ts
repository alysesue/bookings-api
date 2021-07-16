export const defaultTemplates = {
	email: {
		CreatedByCitizenSentToCitizen:
			'<pre>\nYour booking request has been received.\n<br />\nBooking for: <b>${serviceName}.</b>\n' +
			'<br />\nBelow is a confirmation of your booking details.\nBooking status: <b>${status}</b>\nDate:' +
			' <b>${day}</b>\nTime: <b>${time}</b>\n${videoConferenceUrl}\n${locationText}\n</pre>',
		UpdatedByCitizenSentToCitizen:
			'<pre>\nYou have updated a booking.\n<br />\nBooking for: <b>${serviceName}${spNameDisplayedForCitizen}.' +
			'</b>\n<br />\nBelow is a confirmation of your updated booking details.\nBooking status: <b>${status}</b>' +
			'\nDate: <b>${day}</b>\nTime: <b>${time}</b>\n${videoConferenceUrl}\n${locationText}\n</pre>',
		CancelledByCitizenSentToCitizen:
			'<pre>\nYou have cancelled the following booking.\n<br />\nBooking for: ' +
			'<b>${serviceName}${spNameDisplayedForCitizen}.</b>\n<br />\nBooking status: <b>${status}</b>\nDate: ' +
			'<b>${day}</b>\nTime: <b>${time}</b>\n${videoConferenceUrl}\n${locationText}\n</pre>',
		CreatedByCitizenSentToServiceProvider:
			'<pre>\nYou have received a new booking request.\n<br />\nBooking for: ' +
			'<b>${serviceName}${spNameDisplayedForServiceProvider}.</b>\n<br />' +
			'\nBelow is a summary of the booking request details.\n<br/>\nBooking status:' +
			' <b>${status}</b>\nDate: <b>${day}</b>\nTime: <b>${time}</b>\n${videoConferenceUrl}\n${locationText}' +
			'\n</pre>',
		UpdatedByCitizenSentToServiceProvider:
			'<pre>\nThere has been an update to the following booking by the other party.\n<br />\nBooking for:' +
			' <b>${serviceName}${spNameDisplayedForServiceProvider}.</b>\n<br />\nBelow is a confirmation of the' +
			' updated booking details.\n<br/>\nBooking status: <b>${status}</b>\nDate: <b>${day}</b>\nTime:' +
			' <b>${time}</b>\n${videoConferenceUrl}\n${locationText}\n</pre>',
		CancelledByCitizenSentToServiceProvider:
			'<pre>\nThe following booking has been cancelled by the other party.\n<br />\nBooking for:' +
			' <b>${serviceName}${spNameDisplayedForServiceProvider}.</b>\n<br />\nBooking status:' +
			' <b>${status}</b>\nDate: <b>${day}</b>\nTime: <b>${time}</b>\n${videoConferenceUrl}\n${locationText}' +
			'\n</pre>',
		CreatedByServiceProviderSentToCitizen:
			'<pre>\nA booking has been made.\n<br />\nBooking for: <b>${serviceName}${spNameDisplayedForCitizen}.' +
			'</b>\n<br />\nBelow is a confirmation of your booking details.\nBooking status: <b>${status}</b>\nDate:' +
			' <b>${day}</b>\nTime: <b>${time}</b>\n${videoConferenceUrl}\n${locationText}\n</pre>',
		UpdatedByServiceProviderSentToCitizen:
			'<pre>\nThere has been an update to your booking confirmation.\n<br />\nBooking for:' +
			' <b>${serviceName}${spNameDisplayedForCitizen}.</b>\n<br />\nBelow is a confirmation of your updated' +
			' booking details.\nBooking status: <b>${status}</b>\nDate: <b>${day}</b>\nTime: ' +
			'<b>${time}</b>\n${videoConferenceUrl}\n${locationText}\n</pre>',
		CancelledByServiceProviderSentToCitizen:
			'<pre>\nThe following booking has been cancelled by the other party.\n${reasonToReject}\n' +
			'<br />\nBooking for: <b>${serviceName}${spNameDisplayedForCitizen}.</b>\n<br />\nBooking status: ' +
			'<b>${status}</b>\nDate: <b>${day}</b>\nTime: <b>${time}</b>\n${videoConferenceUrl}\n${locationText}' +
			'\n</pre>',
		CreatedByServiceProviderSentToServiceProvider: 'Undefined',
		UpdatedByServiceProviderSentToServiceProvider:
			'<pre>\nYou have updated a booking.\n<br />\nBooking for:' +
			' <b>${serviceName}${spNameDisplayedForServiceProvider}.</b>\n<br />\nBelow is a summary of your updated' +
			' booking details.\n<br/>\nBooking status: <b>${status}</b>\nDate: <b>${day}</b>\nTime:' +
			' <b>${time}</b>\n${videoConferenceUrl}\n${locationText}\n</pre>',
		CancelledByServiceProviderSentToServiceProvider:
			'<pre>\nYou have cancelled the following booking.\n<br />\nBooking for:' +
			' <b>${serviceName}${spNameDisplayedForServiceProvider}.</b>\n<br />\nBooking status:' +
			' <b>${status}</b>\nDate: <b>${day}</b>\nTime: <b>${time}</b>\n${videoConferenceUrl}\n${locationText}' +
			'\n</pre>',
	},

	sms: {},
};
