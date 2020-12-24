import { RequestEndpoint } from 'mol-lib-common';

class RequestEndpointSG extends RequestEndpoint {
	private BASE_URL = process.env['FUNCTIONAL_TEST_BASE_URL'];

	constructor() {
		super();
		this.setBaseUrl(this.BASE_URL).setJson();
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
		'mol-admin-id': 'ce6d2f24-3913-11eb-adc1-0242ac120002',
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
			'mol-admin-id': `ce6d2f24-3913-11eb-adc1-0242ac120002`,
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
		'mol-admin-id': 'b8ef2f6c-3913-11eb-adc1-0242ac120002',
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
			'mol-admin-id': `b8ef2f6c-3913-11eb-adc1-0242ac120002`,
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
		'mol-admin-id': 'e20a41ba-390f-11eb-adc1-0242ac120002',
		'mol-admin-name': 'Armin The Admin',
		'mol-admin-username': 'adminUser',
		'mol-auth-type': 'ADMIN',
	};
	public static create = ({
		organisation = 'localorg',
		nameService = 'admin',
		serviceId,
		molAdminId = 'e20a41ba-390f-11eb-adc1-0242ac120002',
	}: {
		organisation?: string;
		nameService?: string;
		serviceId?: string;
		molAdminId?: string;
	}): ServiceProviderRequestEndpointSG => {
		const apiService = serviceId ? { 'x-api-service': serviceId } : {};
		const headers = {
			'mol-admin-email': `${nameService}@palo-it.com`,
			'mol-admin-groups': `bookingsg:service-provider:${organisation}`,
			'mol-admin-id': molAdminId,
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
		'mol-user-uinfin': 'S7429377H',
		'mol-user-auth-level': '2',
		'mol-auth-type': 'USER',
	};

	public static create = ({ serviceId }: { serviceId?: string }): CitizenRequestEndpointSG => {
		const apiService = serviceId ? { 'x-api-service': serviceId } : {};
		const headers = {
			'mol-token-bypass': 'true',
			'mol-user-id': 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
			'mol-user-uinfin': 'S7429377H',
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
