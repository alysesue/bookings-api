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

export class OrganisationAdminRequestEndpointSG extends RequestEndpointSG {
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
	}): OrganisationAdminRequestEndpointSG => {
		const apiService = serviceId ? { 'x-api-service': serviceId } : {};
		const headers = {
			'mol-admin-email': `${nameService}@palo-it.com`,
			'mol-admin-groups': `bookingsg:org-admin:${organisation}`,
			// TODO: generate uuid
			'mol-admin-id': `f9b327e70bbcf42494ccb28b2d98e00e`,
			'mol-admin-name': `${nameService} The Admin`,
			'mol-admin-username': `${nameService}User`,
			...apiService,
		};
		return new OrganisationAdminRequestEndpointSG(headers);
	};

	private constructor(headers: { [e: string]: string }) {
		super();
		this.setHeaders({
			...this.ADMIN_HEADERS,
			...headers,
		});
	}
}

export class ServiceAdminRequestEndpointSG extends RequestEndpointSG {
	private ADMIN_HEADERS = {
		'mol-token-bypass': 'true',
		'mol-admin-email': 'admin@palo-it.com',
		'mol-admin-groups': 'bookingsg:svc-admin-marriage:localorg',
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
	}): ServiceAdminRequestEndpointSG => {
		const apiService = serviceId ? { 'x-api-service': serviceId } : {};
		const headers = {
			'mol-admin-email': `${nameService}@palo-it.com`,
			'mol-admin-groups': `bookingsg:svc-admin-${nameService}:${organisation}`,
			// TODO: generate uuid
			'mol-admin-id': `f9b327e70bbcf42494ccb28b2d98e00e`,
			'mol-admin-name': `${nameService} The Admin`,
			'mol-admin-username': `${nameService}User`,
			...apiService,
		};
		return new ServiceAdminRequestEndpointSG(headers);
	};

	private constructor(headers: { [e: string]: string }) {
		super();
		this.setHeaders({
			...this.ADMIN_HEADERS,
			...headers,
		});
	}
}

export class ServiceProviderRequestEndpointSG extends RequestEndpointSG {
	private ADMIN_HEADERS = {
		'mol-token-bypass': 'true',
		'mol-admin-email': 'admin@palo-it.com',
		'mol-admin-groups': 'bookingsg:service-provider:localorg',
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
	}): ServiceProviderRequestEndpointSG => {
		const apiService = serviceId ? { 'x-api-service': serviceId } : {};
		const headers = {
			'mol-admin-email': `${nameService}@palo-it.com`,
			'mol-admin-groups': `bookingsg:service-provider:${organisation}`,
			// TODO: generate uuid
			'mol-admin-id': `f9b327e70bbcf42494ccb28b2d98e00e`,
			'mol-admin-name': `${nameService} The Admin`,
			'mol-admin-username': `${nameService}User`,
			...apiService,
		};
		return new ServiceProviderRequestEndpointSG(headers);
	};

	private constructor(headers: { [e: string]: string }) {
		super();
		this.setHeaders({
			...this.ADMIN_HEADERS,
			...headers,
		});
	}
}

export class CitizenRequestEndpointSG extends RequestEndpointSG {
	private CITIZEN_HEADERS = {
		'mol-token-bypass': 'true',
		'mol-user-id': 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
		'mol-user-uinfin': 'G3382058K',
		'mol-user-auth-level': '2',
		'mol-auth-type': 'USER',
	};

	public static create = ({
		serviceId,
	}: {
		serviceId?: string;
	}): CitizenRequestEndpointSG => {
		const apiService = serviceId ? { 'x-api-service': serviceId } : {};
		const headers = {
			'mol-token-bypass': 'true',
			'mol-user-id': 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
			'mol-user-uinfin': 'G3382058K',
			'mol-user-auth-level': '2',
			'mol-auth-type': 'USER',
			...apiService,
		};
		return new CitizenRequestEndpointSG(headers);
	};

	private constructor(headers: { [e: string]: string }) {
		super();
		this.setHeaders({
			...this.CITIZEN_HEADERS,
			...headers,
		});
	}
}
