export const defaultTemplates = {
	email: {
		CreatedByCitizenSentToCitizen:
			'<p>Your booking request has been received.</p>\n' +
			'<p>Booking for: <strong>{serviceName}</strong>.</p>\n' +
			'<p>Below is a confirmation of your booking details.<br>Booking status: <strong>{status}</strong><br>Date: ' +
			'<strong>{day}</strong><br>Time: <strong>{time}</strong><br>{videoConferenceUrl}<br>{location}<br>{manageBookingLink}</p>\n' +
			'<p><br></p>',
		UpdatedByCitizenSentToCitizen:
			'<p>You have updated a booking.</p>\n' +
			'<p>Booking for: <strong>{serviceName}</strong> <strong>{spNameDisplayedForCitizen}</strong>.</p>\n' +
			'<p>Below is a confirmation of your updated booking details.<br>Booking status: <strong>{status}</strong><br>Date: ' +
			'<strong>{day}</strong><br>Time: <strong>{time}</strong><br>{videoConferenceUrl}<br>{location}<br>{manageBookingLink}</p>',
		CancelledByCitizenSentToCitizen:
			'<p>You have cancelled the following booking.</p>\n' +
			'<p>Booking for: <strong>{serviceName} {spNameDisplayedForCitizen}</strong>.</p>\n' +
			'<p>Booking status: <strong>{status}</strong><br>Date: <strong>{day}</strong><br>Time:' +
			' <strong>{time}</strong><br>{videoConferenceUrl}<br>{location}</p>',
		CreatedByCitizenSentToServiceProvider:
			'<p>You have received a new booking request.</p>\n' +
			'<p>Booking for: <strong>{serviceName}</strong> <strong>{spNameDisplayedForServiceProvider}</strong>.</p>\n' +
			'<p>Below is a summary of the booking request details.<br>Booking status: <strong>{status}</strong><br>Date:' +
			' <strong>{day}</strong><br>Time: <strong>{time}</strong><br>{videoConferenceUrl}<br>{location}</p>',
		UpdatedByCitizenSentToServiceProvider:
			'<p>There has been an update to the following booking by the other party.</p>\n' +
			'<p>Booking for: <strong>{serviceName}</strong> <strong>{spNameDisplayedForServiceProvider}</strong>.</p>\n' +
			'<p>Below is a confirmation of the updated booking details.<br>Booking status: <strong>{status}</strong><br>Date: ' +
			'<strong>{day}</strong><br>Time: <strong>{time}</strong><br>{videoConferenceUrl}<br>{location}</p>',
		CancelledByCitizenSentToServiceProvider:
			'<p>The following booking has been cancelled by the other party.</p>\n' +
			'<p>Booking for: <strong>{serviceName}</strong> <strong>{spNameDisplayedForServiceProvider}</strong>.</p>\n' +
			'<p>Booking status: <strong>{status}</strong><br>Date: <strong>{day}</strong><br>Time:' +
			' <strong>{time}</strong><br>{videoConferenceUrl}<br>{location}</p>',
		CreatedByServiceProviderSentToCitizen:
			'<p>A booking has been made.</p>\n' +
			'<p>Booking for: <strong>{serviceName}</strong> <strong>{spNameDisplayedForCitizen}</strong>.</p>\n' +
			'<p>Below is a confirmation of your booking details.<br>Booking status: <strong>{status}</strong><br>Date: <strong>{day}</strong><br>Time:' +
			' <strong>{time}</strong><br>{videoConferenceUrl}<br>{location}<br>{manageBookingLink}</p>',
		UpdatedByServiceProviderSentToCitizen:
			'<p>There has been an update to your booking confirmation.</p>\n' +
			'<p>Booking for: <strong>{serviceName}</strong> <strong>{spNameDisplayedForCitizen}</strong>.</p>\n' +
			'<p>Below is a confirmation of your updated booking details.<br>Booking status: <strong>{status}</strong><br>Date: <strong>{day}</strong><br>Time:' +
			' <strong>{time}</strong><br>{videoConferenceUrl}<br>{location}<br>{manageBookingLink}</p>',
		CancelledByServiceProviderSentToCitizen:
			'<p>The following booking has been cancelled by the other party.<br>{reasonToReject}</p>\n' +
			'<p>Booking for: <strong>{serviceName}</strong> <strong>{spNameDisplayedForCitizen}</strong>.</p>\n' +
			'<p>Booking status: <strong>{status}</strong><br>Date: <strong>{day}</strong><br>Time: ' +
			'<strong>{time}</strong><br>{videoConferenceUrl}<br>{location}</p>',
		CreatedByServiceProviderSentToServiceProvider: 'Undefined ',
		UpdatedByServiceProviderSentToServiceProvider:
			'<p>You have updated a booking.</p>\n' +
			'<p>Booking for: <strong>{serviceName}</strong> <strong>{spNameDisplayedForServiceProvider}</strong>.</p>\n' +
			'<p>Below is a summary of your updated booking details.<br>Booking status: <strong>{status}</strong><br>Date: <strong>{day}</strong><br>Time:' +
			' <strong>{time}</strong><br>{videoConferenceUrl}<br>{location}</p>',
		CancelledByServiceProviderSentToServiceProvider:
			'<p>You have cancelled the following booking.</p>\n' +
			'<p>Booking for: <strong>{serviceName}</strong> <strong>{spNameDisplayedForServiceProvider}</strong>.</p>\n' +
			'<p>Booking status: <strong>{status}</strong><br>Date: <strong>{day}</strong><br>Time: ' +
			'<strong>{time}</strong><br>{videoConferenceUrl}<br>{location}</p>',
		DefaultEventNotification:
			'<p>{eventUpdateDescription}</p>\n' +
			'<p>Booking for: <strong>{eventName}</strong> - <strong>{serviceName}</strong>.</p>\n' +
			'<p>{eventSummaryDescription}</p>' +
			'<p>Booking status: <strong>{status}</strong></p>' +
			'<p>Date & times:<br><strong>{dateTimeServiceProvider}</strong></p>' +
			'<p>{location}</p>' +
			'{manageBookingLink}' +
			'<br><p>Do not reply to this email.</p>',
	},

	sms: {},

	eventUpdateDescription: {
		CreatedByCitizenSentToCitizenEvent: 'A booking has been made.',
		UpdatedByCitizenSentToCitizenEvent: '',
		CancelledByCitizenSentToCitizenEvent: '',
		CreatedByCitizenSentToServiceProviderEvent: 'A booking has been made.',
		UpdatedByCitizenSentToServiceProviderEvent: '',
		CancelledByCitizenSentToServiceProviderEvent: '',
		CreatedByServiceProviderSentToCitizenEvent: 'A booking has been made.',
		UpdatedByServiceProviderSentToCitizenEvent: '',
		CancelledByServiceProviderSentToCitizenEvent: '',
		CreatedByServiceProviderSentToServiceProviderEvent: 'A booking has been made.',
		UpdatedByServiceProviderSentToServiceProviderEvent: '',
		CancelledByServiceProviderSentToServiceProviderEvent: '',
	},

	eventSummaryDescription: {
		CreatedByCitizenSentToCitizenEvent: 'Below is a summary of the booking details.',
		UpdatedByCitizenSentToCitizenEvent: '',
		CancelledByCitizenSentToCitizenEvent: '',
		CreatedByCitizenSentToServiceProviderEvent: 'Below is a summary of the booking details.',
		UpdatedByCitizenSentToServiceProviderEvent: '',
		CancelledByCitizenSentToServiceProviderEvent: '',
		CreatedByServiceProviderSentToCitizenEvent: 'Below is a summary of the booking details.',
		UpdatedByServiceProviderSentToCitizenEvent: '',
		CancelledByServiceProviderSentToCitizenEvent: '',
		CreatedByServiceProviderSentToServiceProviderEvent: 'Below is a summary of the booking details.',
		UpdatedByServiceProviderSentToServiceProviderEvent: '',
		CancelledByServiceProviderSentToServiceProviderEvent: '',
	},
};
