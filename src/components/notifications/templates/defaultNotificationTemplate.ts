export const defaultTemplates = {
	email: {
		CreatedByCitizenSentToCitizen:
			'<p> Your booking request has been received.</p>\n' +
			'<p>Booking for: <strong>{serviceName}</strong>.</p>\n' +
			'<p>Below is a confirmation of your booking details.<br>Booking status: <strong>{status}</strong><br>Date: ' +
			'<strong>{day}</strong><br>Time: <strong>{time}</strong><br>{videoConferenceUrl}<br>{locationText}</p>\n' +
			'<p><br>&nbsp;</p>',
		UpdatedByCitizenSentToCitizen:
			'<p>You have updated a booking.</p>\n' +
			'<p>Booking for: <strong>{serviceName}</strong> <strong>{spNameDisplayedForCitizen}</strong>.</p>\n' +
			'<p>Below is a confirmation of your updated booking details.<br>Booking status: <strong>{status}</strong><br>Date: ' +
			'<strong>{day}</strong><br>Time: <strong>{time}</strong><br>{videoConferenceUrl}<br>{locationText}&nbsp;</p>',
		CancelledByCitizenSentToCitizen:
			'<p>You have cancelled the following booking.</p>\n' +
			'<p>Booking for: <strong>{serviceName} {spNameDisplayedForCitizen}</strong>.</p>\n' +
			'<p>Booking status: <strong>{status}</strong><br>Date: <strong>{day}</strong><br>Time:' +
			' <strong>{time}</strong><br>{videoConferenceUrl}<br>{locationText}</p>',
		CreatedByCitizenSentToServiceProvider:
			'<p>You have received a new booking request.</p>\n' +
			'<p>Booking for: <strong>{serviceName}</strong> <strong>{spNameDisplayedForServiceProvider}</strong>.</p>\n' +
			'<p>Below is a summary of the booking request details.<br>Booking status: <strong>{status}</strong><br>Date:' +
			' <strong>{day}</strong><br>Time: <strong>{time}</strong><br>{videoConferenceUrl}<br>{locationText}&nbsp;</p>',
		UpdatedByCitizenSentToServiceProvider:
			'<p>There has been an update to the following booking by the other party.</p>\n' +
			'<p>Booking for: <strong>{serviceName}</strong> <strong>{spNameDisplayedForServiceProvider}</strong>.</p>\n' +
			'<p>Below is a confirmation of the updated booking details.<br>Booking status: <strong>{status}</strong><br>Date: ' +
			'<strong>{day}</strong><br>Time: <strong>{time}</strong><br>{videoConferenceUrl}<br>{locationText}&nbsp;</p>',
		CancelledByCitizenSentToServiceProvider:
			'<p>The following booking has been cancelled by the other party.</p>\n' +
			'<p>Booking for: <strong>{serviceName}</strong> <strong>{spNameDisplayedForServiceProvider}</strong>.</p>\n' +
			'<p>Booking status: <strong>{status}</strong><br>Date: <strong>{day}</strong><br>Time:' +
			' <strong>{time}</strong><br>{videoConferenceUrl}<br>{locationText}&nbsp;</p>',
		CreatedByServiceProviderSentToCitizen:
			'<p>A booking has been made.</p>\n' +
			'<p>Booking for: <strong>{serviceName}</strong> <strong>{spNameDisplayedForCitizen}</strong>.</p>\n' +
			'<p>Below is a confirmation of your booking details.<br>Booking status: <strong>{status}</strong><br>Date: <strong>{day}</strong><br>Time:' +
			' <strong>{time}</strong><br>{videoConferenceUrl}<br>{locationText}&nbsp;</p>',
		UpdatedByServiceProviderSentToCitizen:
			'<p>There has been an update to your booking confirmation.</p>\n' +
			'<p>Booking for: <strong>{serviceName}</strong> <strong>{spNameDisplayedForCitizen}</strong>.</p>\n' +
			'<p>Below is a confirmation of your updated booking details.<br>Booking status: <strong>{status}</strong><br>Date: <strong>{day}</strong><br>Time:' +
			' <strong>{time}</strong><br>{videoConferenceUrl}<br>{locationText}&nbsp;</p>',
		CancelledByServiceProviderSentToCitizen:
			'<p>The following booking has been cancelled by the other party.<br>{reasonToReject}</p>\n' +
			'<p>Booking for: <strong>{serviceName}</strong> <strong>{spNameDisplayedForCitizen}</strong>.</p>\n' +
			'<p>Booking status: <strong>{status}</strong><br>Date: <strong>{day}</strong><br>Time: ' +
			'<strong>{time}</strong><br>{videoConferenceUrl}<br>{locationText}&nbsp;</p>',
		CreatedByServiceProviderSentToServiceProvider: 'Undefined',
		UpdatedByServiceProviderSentToServiceProvider:
			'<p>You have updated a booking.</p>\n' +
			'<p>Booking for: <strong>{serviceName}</strong> <strong>{spNameDisplayedForServiceProvider}</strong>.</p>\n' +
			'<p>Below is a summery of your updated booking details.<br>Booking status: <strong>{status}</strong><br>Date: <strong>{day}</strong><br>Time:' +
			' <strong>{time}</strong><br>{videoConferenceUrl}<br>{locationText}&nbsp;</p>',
		CancelledByServiceProviderSentToServiceProvider:
			'<p>You have cancelled the following booking.</p>\n' +
			'<p>Booking for: <strong>{serviceName}</strong> <strong>{spNameDisplayedForServiceProvider}</strong>.</p>\n' +
			'<p>Booking status: <strong>{status}</strong><br>Date: <strong>{day}</strong><br>Time: ' +
			'<strong>{time}</strong><br>{videoConferenceUrl}<br>{locationText}&nbsp;</p>',
	},

	sms: {},
};
