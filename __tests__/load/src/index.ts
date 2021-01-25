import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

const baseUrl = `${__ENV.LOAD_TEST_BASE_URL}/bookingsg/api/v1`;

const headers = {
	accept: '*/*',
};

export const options = {
	scenarios: {
		one: {
			executor: 'ramping-vus',
			startVUs: 1,
			stages: [
				{ duration: '1s', target: 1 },
				{ duration: '0s', target: 5 },
				{ duration: '20s', target: 5 },
				{ duration: '0s', target: 10 },
				{ duration: '20s', target: 10 },
				{ duration: '0s', target: 20 },
				{ duration: '20s', target: 20 },
				{ duration: '0s', target: 30 },
				{ duration: '20s', target: 30 },
				{ duration: '0s', target: 50 },
				{ duration: '20s', target: 50 },
				{ duration: '0s', target: 0 },
				{ duration: '10s', target: 0 },
			],
		},
	},
};

export function setup() {}

const sumDurationTrend = new Trend('request_sum_duration');
const bookingDurationTrend = new Trend('booking_duration');

export default function () {
	let request_sum_duration = 0;

	let response = http.post(`${baseUrl}/usersessions/anonymous`, null, {
		headers,
	});
	request_sum_duration += response.timings.duration;
	check(response, { 'session success': (r) => r.status >= 200 && r.status < 300 });

	response = http.get(`${baseUrl}/users/me`, { headers });
	request_sum_duration += response.timings.duration;
	check(response, { 'user success': (r) => r.status >= 200 && r.status < 300 });

	const postBookingBody = {
		captchaToken: 'dummy',
		citizenEmail: 'jane@gmail.com',
		citizenName: 'Jane',
		citizenPhone: '0404040404',
		citizenUinFin: 'S4181859Z',
		description: 'I am making a booking',
		endDateTime: '2023-01-05T02:00:00.000Z',
		location: 'some street name',
		serviceProviderId: 2,
		startDateTime: '2023-01-05T01:00:00.000Z',
	};

	response = http.post(`${baseUrl}/bookings`, JSON.stringify(postBookingBody), {
		headers: { accept: '*/*', 'content-type': 'application/json', 'x-api-service': '2' },
	});
	request_sum_duration += response.timings.duration;
	bookingDurationTrend.add(response.timings.duration);
	check(response, { 'booking success': (r) => r.status >= 200 && r.status < 300 });

	sumDurationTrend.add(request_sum_duration);

	sleep(1);
}

export function teardown() {}
