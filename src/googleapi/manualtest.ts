import { GoogleCalendarApiWrapper } from './calendarwrapper';

const wrapper = new GoogleCalendarApiWrapper();

async function callCalendar2() {
	const response = await (await wrapper.getCalendarApi()).events.list({
		calendarId: 'primary',
		timeMin: (new Date()).toISOString(),
		maxResults: 10,
		singleEvents: true,
		orderBy: 'startTime',
	});

	const events = response.data.items;

	console.log(JSON.stringify(response));

	if (events.length) {
		console.log('Upcoming 10 events:');
		events.map((event, i) => {
			const start = event.start.dateTime || event.start.date;
			console.log(`${start} - ${event.summary}`);
		});
	} else {
		console.log('No upcoming events found.');
	}
}

async function createCalendar() {
	const api = (await wrapper.getCalendarApi());

	const response = await api.calendars.insert({
		requestBody: {
			summary: 'Booking SG test calendar',
			timeZone: 'Asia/Singapore'
		}
	});

	console.log(JSON.stringify(response));

	console.log(JSON.stringify(response.data));
}

createCalendar();
