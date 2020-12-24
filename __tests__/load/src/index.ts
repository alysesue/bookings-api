import http from 'k6/http';
import { check } from 'k6';

const config = {
	// baseUrl: 'http://localhost:3999/bookingsg/api/v1/',
	baseUrl: 'https://www.dev.booking.gov.sg/bookingsg/api/v1/',
};
const headers = {
	'use-admin-auth-forwarder': 'true',
	cookie:
		'MOLAdminToken=eyJ2ZXJzaW9uIjoiMCIsImVuYyI6IkEyNTZHQ00iLCJhbGciOiJkaXIiLCJraWQiOiI4ZmRnSmhKLTluTGVxalZTa2FzaU82dTNNQzhldkhXV1RzVnEzYzlxTlhNIn0..Pr7EKlFzYs2Suu3k.chmT8WEiQCX2lJRzOm-GfF3B2fpqvT9WkvgW4yyBUBjmcqafu54uu4ojKOqetPacR6gOspZae17Uvwb0Tqqp_uYqHsBBlaKDbsfjr5YCSODA_CjzoDkcgFMwxhcTJt07H2sSzgF86dor_oBsas829hLhzbOOA21AloefFMI5Y3efm-6LK5vYLMAzGyhtA1IZ427PSXmf5ETWi21-KpIjvrGT35nyrb5zOLGkhikGAEosEF4RRzW7xuPQEHC3OHntMeBiHnjlwQV65_o_yXfVyWHJZEoXrKr-n3h8dBNxxS0emdp8mAmaryeukzsJbk9vycdAsjQW8JGXJhDZ4dW86e-IoCahdRxl0QgNTM1HzeIy_yYa4w.JPyRFcudRZ-a5y2-fpQlpQ',
};

export const options = {
	stages: [
		{ duration: '1m', target: 50 },
		{ duration: '1m', target: 100 },
		{ duration: "1m", target: 150 },
		{ duration: "1m", target: 200 }
	],
	vus: 10,
	// duration: '30s',
};

// STUB: Initialization code goes here, these will be executed for every VU

export function setup() {
	// STUB: Setup is called only once at the beginning of the test, after the init stage but before the VU stage (default function)
}

export default function () {
	// STUB: Code inside default is called "VU code", and is run over and over for as long as the test is running
	// http.get(config.baseUrl + 'service-providers', { headers });
	const res = http.get(config.baseUrl + 'service-providers', { headers });
	check(res, { 'status was 200': (r) => r.status === 200 });
	check(res, { 'status was 401': (r) => r.status === 401 });
}

export function teardown() {
	// STUB: Teardown is called only once at the end of a test, after the VU stage (default function)
}
