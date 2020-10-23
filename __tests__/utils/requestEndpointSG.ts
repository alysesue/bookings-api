import { RequestEndpoint } from 'mol-lib-common';

class RequestEndpointSG extends RequestEndpoint {
	private BASE_URL = process.env['FUNCTIONAL_TEST_BASE_URL'];

	public static create = (): RequestEndpointSG => {
		return new RequestEndpointSG();
	};

	constructor() {
		super();
		this.setBaseUrl(this.BASE_URL).setHeader('Content-Type', 'application/json');
	}

	public setHeaders = (headerObject: { [e: string]: string }) => {
		Object.keys(headerObject).forEach((key) => {
			this.setHeader(key, headerObject[key]);
		});
		return this;
	};
}

export class AdminRequestEndpointSG extends RequestEndpointSG {
	private ADMIN_HEADERS = {
		'mol-token-bypass': 'true',
		'mol-admin-email': 'admin@palo-it.com',
		'mol-admin-groups': 'bookingsg:org-admin:localorg',
		'mol-admin-id': 'df9e8028-f308-4fb7-a9d8-d8af00455981',
		'mol-admin-name': 'Armin The Admin',
		'mol-admin-username': 'adminUser',
		'mol-auth-type': 'ADMIN',
	};

	public static create = (): AdminRequestEndpointSG => {
		return new AdminRequestEndpointSG();
	};

	private constructor() {
		super();
		this.setHeaders(this.ADMIN_HEADERS);
	}
}
