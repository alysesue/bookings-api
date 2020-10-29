import { RequestEndpoint } from 'mol-lib-common';

class RequestEndpointSG extends RequestEndpoint {
	private BASE_URL = process.env['FUNCTIONAL_TEST_BASE_URL'];

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

	public static create = ({
		organisation = 'localorg',
		nameService = 'admin',
		serviceId,
	}: {
		organisation?: string;
		nameService?: string;
		serviceId?: string;
	}): AdminRequestEndpointSG => {
		const apiService = serviceId ? { 'x-api-service': serviceId } : {};
		const headers = {
			'mol-admin-email': `${nameService}@palo-it.com`,
			'mol-admin-groups': `bookingsg:org-admin:${organisation}`,
			'mol-admin-id': `f9b327e70bbcf42494ccb28b2d98e00e`,
			'mol-admin-name': `${nameService} The Admin`,
			'mol-admin-username': `${nameService}User`,
			...apiService,
		};
		return new AdminRequestEndpointSG(headers);
	};

	private constructor(headers: { [e: string]: string }) {
		super();
		this.setHeaders({
			...this.ADMIN_HEADERS,
			...headers,
		});
	}
}
